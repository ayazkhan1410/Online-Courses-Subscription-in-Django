"""Enable email as the chosen two-step login method."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail

from utils.inbox import record_outbound_mail
from django.db import transaction
from django.utils import timezone

from accounts.models import EmailVerificationCode
from accounts.utils.email_verification import (
    MAX_ATTEMPTS,
    RESEND_SECONDS,
    _invalidate_codes,
)
from mfa.exceptions import MfaError
from mfa.models import Authenticator, LoginChallenge, RecoveryCode
from mfa.utils.alerts import send_security_alert
from mfa.utils.code import generate_login_code, hash_value, value_matches
from mfa.utils.lockout import clear_failures, is_locked, record_failure

logger = logging.getLogger(__name__)

CODE_MINUTES = 10


def _send_enable_code(user, code: str) -> bool:
    subject = f'Your Study with Ayaz code: {code}'
    body = (
        f'Your code is {code}. It expires in 10 minutes. '
        "If you didn't sign up, ignore this email."
    )
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as exc:
        logger.error(
            'MFA enable email failed | user_id=%s error=%s',
            user.pk,
            type(exc).__name__,
        )
        return False
    record_outbound_mail([user.email], subject, body)
    return True


def _enable_resend_key(email: str) -> str:
    return f'mfa_email_enable_resend:{email.lower()}'


def start_email_mfa(user) -> None:
    from django.core.cache import cache

    if user.mfa_method:
        raise MfaError('Two-factor authentication is already enabled.')
    email = user.email.lower()
    key = _enable_resend_key(email)
    if not cache.add(key, 1, RESEND_SECONDS):
        raise MfaError('Please wait before requesting a new code.')
    code = generate_login_code()
    _invalidate_codes(user)
    EmailVerificationCode.objects.create(
        user=user,
        email=email,
        code_hash=hash_value(code, 'mfa_email_enable'),
        expires_at=timezone.now() + timedelta(minutes=CODE_MINUTES),
    )
    if not _send_enable_code(user, code):
        cache.delete(key)
        raise MfaError('Could not send the email. Try again.')


def confirm_email_mfa(user, code: str) -> None:
    cleaned = code.strip().replace(' ', '')
    if is_locked(user.pk):
        raise MfaError('Too many attempts. Try again later.')
    with transaction.atomic():
        row = (
            EmailVerificationCode.objects.select_for_update()
            .filter(user=user, expires_at__gt=timezone.now())
            .order_by('-created_at')
            .first()
        )
        if row is None or row.attempts >= MAX_ATTEMPTS:
            raise MfaError('Invalid or expired code.')
        if not value_matches(cleaned, row.code_hash, 'mfa_email_enable'):
            row.attempts += 1
            row.save(update_fields=['attempts'])
            record_failure(user.pk)
            raise MfaError('Invalid code.')
        row.expires_at = timezone.now()
        row.save(update_fields=['expires_at'])
        Authenticator.objects.filter(user=user).delete()
        RecoveryCode.objects.filter(user=user).delete()
        user.mfa_method = user.MFA_EMAIL
        user.save(update_fields=['mfa_method'])
        clear_failures(user.pk)
    send_security_alert(user, 'enabled')
    logger.info('Email MFA enabled | user_id=%s', user.pk)


def verify_email_mfa_disable(user, code: str) -> bool:
    cleaned = code.strip().replace(' ', '')
    challenge = (
        LoginChallenge.objects.filter(
            user=user,
            method=LoginChallenge.Method.EMAIL,
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        )
        .order_by('-id')
        .first()
    )
    if challenge is None:
        return False
    return value_matches(cleaned, challenge.code_hash, 'login')
