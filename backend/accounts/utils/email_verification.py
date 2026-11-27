"""Sign-up and login email verification codes."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from accounts.models import CustomUser, EmailVerificationCode
from mfa.exceptions import MfaError
from mfa.utils.code import generate_login_code, hash_value, value_matches
from mfa.utils.lockout import clear_failures, is_locked, record_failure
from utils.inbox import record_outbound_mail

logger = logging.getLogger(__name__)

CODE_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_SECONDS = 60
RESEND_HOUR_LIMIT = 5


def _resend_key(email: str) -> str:
    return f'email_verify_resend:{email.lower()}'


def _hourly_key(email: str) -> str:
    return f'email_verify_hour:{email.lower()}'


def _send_code_email(email: str, code: str) -> bool:
    subject = f'Your Study with Ayaz code: {code}'
    body = (
        f'Your code is {code}. It expires in 10 minutes. '
        "If you didn't sign up, ignore this email."
    )
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email])
    except Exception as exc:
        logger.error(
            'Verification email failed | email=%s error=%s',
            email,
            type(exc).__name__,
        )
        return False
    record_outbound_mail([email], subject, body)
    logger.info('Verification email sent | email=%s', email)
    return True


def _invalidate_codes(user: CustomUser) -> None:
    now = timezone.now()
    EmailVerificationCode.objects.filter(
        user=user,
        expires_at__gt=now,
    ).update(expires_at=now)


def issue_verification_code(user: CustomUser) -> None:
    email = user.email.lower()
    if not cache.add(_resend_key(email), 1, RESEND_SECONDS):
        raise MfaError('Please wait before requesting a new code.')
    hourly = cache.get(_hourly_key(email), 0)
    if hourly >= RESEND_HOUR_LIMIT:
        raise MfaError('Too many codes sent. Try again later.')
    code = generate_login_code()
    now = timezone.now()
    _invalidate_codes(user)
    EmailVerificationCode.objects.create(
        user=user,
        email=email,
        code_hash=hash_value(code, 'email_verify'),
        expires_at=now + timedelta(minutes=CODE_MINUTES),
    )
    if not _send_code_email(email, code):
        cache.delete(_resend_key(email))
        raise MfaError('Could not send the email. Try again.')
    cache.set(_hourly_key(email), hourly + 1, 3600)


def resend_verification(email: str) -> None:
    """Always succeeds from the caller's perspective for unknown emails."""
    user = CustomUser.objects.filter(
        email__iexact=email, email_verified=False
    ).first()
    if user is None:
        return
    try:
        issue_verification_code(user)
    except MfaError:
        pass


def verify_email_code(email: str, code: str) -> CustomUser:
    cleaned = code.strip().replace(' ', '')
    email_l = email.strip().lower()
    user = CustomUser.objects.filter(email__iexact=email_l).first()
    if user is None or user.email_verified:
        raise MfaError('Invalid or expired code.')
    if is_locked(user.pk):
        raise MfaError('Too many attempts. Try again later.')
    with transaction.atomic():
        row = (
            EmailVerificationCode.objects.select_for_update()
            .filter(
                user=user,
                email=email_l,
                expires_at__gt=timezone.now(),
            )
            .order_by('-created_at')
            .first()
        )
        if row is None or row.attempts >= MAX_ATTEMPTS:
            raise MfaError('Invalid or expired code.')
        if value_matches(cleaned, row.code_hash, 'email_verify'):
            user.email_verified = True
            user.save(update_fields=['email_verified'])
            row.expires_at = timezone.now()
            row.save(update_fields=['expires_at'])
            clear_failures(user.pk)
            return user
        row.attempts += 1
        if row.attempts >= MAX_ATTEMPTS:
            row.expires_at = timezone.now()
        row.save(update_fields=['attempts', 'expires_at'])
        record_failure(user.pk)
        raise MfaError('Invalid code.')
