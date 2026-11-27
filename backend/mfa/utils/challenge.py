"""Create, verify, and resend a login challenge. Resend cooldown is 60s."""

import logging
from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from mfa.exceptions import MfaError
from mfa.models import Authenticator, LoginChallenge, RecoveryCode
from mfa.utils.alerts import send_login_code, send_security_alert
from mfa.utils.code import (
    consume_recovery_code,
    generate_login_code,
    hash_value,
    value_matches,
)
from mfa.utils.lockout import clear_failures, is_locked, record_failure
from mfa.utils.totp import consume_totp

logger = logging.getLogger(__name__)

CHALLENGE_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_SECONDS = 60


def _resend_key(challenge_id: int) -> str:
    return f'mfa_resend:{challenge_id}'


def available_methods(user) -> list[str]:
    method = getattr(user, 'mfa_method', '') or ''
    if method == 'totp':
        confirmed = Authenticator.objects.filter(
            user=user,
            confirmed_at__isnull=False,
        ).exists()
        if not confirmed:
            return []
        methods = ['totp']
        if RecoveryCode.objects.filter(user=user, used_at__isnull=True).exists():
            methods.append('recovery')
        return methods
    if method == 'email':
        return ['email']
    return []


def _issue_email_code(challenge: LoginChallenge) -> None:
    # shortcut: cooldown key is in the default cache (per process until shared).
    if not cache.add(_resend_key(challenge.pk), 1, RESEND_SECONDS):
        raise MfaError('Please wait before requesting a new code.')
    code = generate_login_code()
    challenge.code_hash = hash_value(code, 'login')
    challenge.method = LoginChallenge.Method.EMAIL
    challenge.expires_at = timezone.now() + timedelta(minutes=CHALLENGE_MINUTES)
    challenge.save(update_fields=['code_hash', 'method', 'expires_at'])
    if not send_login_code(challenge.user, code):
        cache.delete(_resend_key(challenge.pk))
        raise MfaError('Could not send the email. Try again.')


def create_challenge(user, methods: list[str]) -> LoginChallenge:
    if user.mfa_method == 'totp':
        method = LoginChallenge.Method.TOTP
    elif user.mfa_method == 'email':
        method = LoginChallenge.Method.EMAIL
    else:
        method = (
            LoginChallenge.Method.TOTP
            if 'totp' in methods
            else LoginChallenge.Method.EMAIL
        )
    now = timezone.now()
    LoginChallenge.objects.filter(user=user, used_at__isnull=True).update(used_at=now)
    challenge = LoginChallenge.objects.create(
        user=user,
        method=method,
        expires_at=now + timedelta(minutes=CHALLENGE_MINUTES),
    )
    logger.info(
        'MFA challenge created | user_id=%s method=%s',
        user.pk,
        method,
    )
    if method == LoginChallenge.Method.EMAIL:
        _issue_email_code(challenge)
    return challenge


def mfa_gate(user) -> dict | None:
    """Payload when a token must not be issued yet, else None."""
    methods = available_methods(user)
    if not methods:
        return None
    if is_locked(user.pk):
        raise MfaError('Too many attempts. Try again later.')
    challenge = create_challenge(user, methods)
    return {
        'mfa_required': True,
        'challenge_token': challenge.token,
        'methods': methods,
    }


def _accept(challenge: LoginChallenge, code: str, method: str) -> bool:
    if method == LoginChallenge.Method.TOTP:
        return consume_totp(challenge.user, code)
    if method == LoginChallenge.Method.EMAIL:
        cleaned = code.strip().replace(' ', '')
        return value_matches(cleaned, challenge.code_hash, 'login')
    if method == LoginChallenge.Method.RECOVERY:
        return consume_recovery_code(challenge.user, code)
    return False


def verify_challenge(token: str, code: str, method: str):
    with transaction.atomic():
        challenge = (
            LoginChallenge.objects.select_for_update()
            .select_related('user')
            .filter(token=token)
            .first()
        )
        if (
            challenge is None
            or challenge.used_at is not None
            or challenge.expires_at <= timezone.now()
            or not challenge.user.is_active
        ):
            error = 'Invalid or expired challenge.'
            user = None
        elif is_locked(challenge.user_id) or challenge.attempts >= MAX_ATTEMPTS:
            error = 'Too many attempts. Try again later.'
            user = None
        elif _accept(challenge, code, method):
            challenge.used_at = timezone.now()
            challenge.method = method
            challenge.save(update_fields=['used_at', 'method'])
            clear_failures(challenge.user_id)
            error = None
            user = challenge.user
        else:
            challenge.attempts += 1
            challenge.save(update_fields=['attempts'])
            record_failure(challenge.user_id)
            error = 'Invalid code.'
            user = None
            logger.warning(
                'MFA verify failed | user_id=%s method=%s attempts=%s',
                challenge.user_id,
                method,
                challenge.attempts,
            )
    if error:
        raise MfaError(error)
    logger.info('MFA verified | user_id=%s method=%s', user.pk, method)
    return user


def resend_challenge(token: str) -> None:
    challenge = (
        LoginChallenge.objects.select_related('user').filter(token=token).first()
    )
    if (
        challenge is None
        or challenge.used_at is not None
        or challenge.expires_at <= timezone.now()
    ):
        raise MfaError('Invalid or expired challenge.')
    if is_locked(challenge.user_id) or challenge.attempts >= MAX_ATTEMPTS:
        raise MfaError('Too many attempts. Try again later.')
    if challenge.user.mfa_method != 'email':
        raise MfaError('Resend is only available for email codes.')
    _issue_email_code(challenge)


def status_for(user) -> dict:
    method = getattr(user, 'mfa_method', '') or ''
    enabled = bool(method)
    methods = available_methods(user) if enabled else []
    remaining = RecoveryCode.objects.filter(user=user, used_at__isnull=True).count()
    available_to_enable = [] if enabled else ['totp', 'email']
    return {
        'enabled': enabled,
        'method': method,
        'methods': methods,
        'available_to_enable': available_to_enable,
        'has_password': user.has_usable_password(),
        'recovery_codes_remaining': remaining,
    }


def disable_mfa(user, password: str, code: str) -> None:
    if not getattr(user, 'mfa_method', ''):
        raise MfaError('Two-factor authentication is not enabled.')
    if password:
        if not user.check_password(password):
            raise MfaError('Invalid password.')
    elif code:
        cleaned = code.strip()
        if user.mfa_method == 'email':
            from mfa.utils.email_mfa import verify_email_mfa_disable

            accepted = verify_email_mfa_disable(user, cleaned)
        elif cleaned.isdigit() and len(cleaned) == 6:
            accepted = consume_totp(user, cleaned)
        else:
            accepted = consume_recovery_code(user, cleaned)
        if not accepted:
            raise MfaError('Invalid code.')
    else:
        raise MfaError('Password or code is required.')
    now = timezone.now()
    with transaction.atomic():
        Authenticator.objects.filter(user=user).delete()
        RecoveryCode.objects.filter(user=user).delete()
        LoginChallenge.objects.filter(user=user, used_at__isnull=True).update(
            used_at=now
        )
        user.mfa_method = ''
        user.save(update_fields=['mfa_method'])
    send_security_alert(user, 'disabled')
    logger.info('MFA disabled | user_id=%s', user.pk)
