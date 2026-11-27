"""Security emails. The message body may contain a code; logs must not."""

import hashlib
import logging

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

_DEVICE_TTL = 60 * 60 * 24 * 180

_ALERTS = {
    'enabled': (
        'Two-factor authentication is on',
        'Two-factor authentication was turned on for your account. '
        'If this was not you, reset your password.',
    ),
    'disabled': (
        'Two-factor authentication is off',
        'Two-factor authentication was turned off for your account. '
        'If this was not you, reset your password.',
    ),
    'new_device': (
        'New device sign-in',
        'Your account was used from a new device. '
        'If this was not you, reset your password.',
    ),
}


def _send(user, subject: str, message: str) -> bool:
    try:
        send_mail(subject, message, settings.EMAIL_HOST_USER, [user.email])
    except Exception as exc:
        logger.error(
            'MFA email failed | user_id=%s error=%s',
            user.pk,
            type(exc).__name__,
        )
        return False
    logger.info('MFA email sent | user_id=%s subject=%s', user.pk, subject)
    return True


def send_login_code(user, code: str) -> bool:
    return _send(
        user,
        'Your sign-in code',
        f'Your sign-in code is {code}. It expires in 10 minutes. '
        'If you did not try to sign in, you can ignore this email.',
    )


def send_security_alert(user, kind: str) -> None:
    subject, message = _ALERTS[kind]
    _send(user, subject, message)


def remember_device(user, request) -> None:
    """Email when the browser changes. First device is stored quietly."""
    if request is None:
        return
    ua = (request.META.get('HTTP_USER_AGENT') or '')[:500]
    digest = hashlib.sha256(ua.encode()).hexdigest()
    key = f'mfa_device:{user.pk}'
    previous = cache.get(key)
    cache.set(key, digest, _DEVICE_TTL)
    if previous and previous != digest:
        send_security_alert(user, 'new_device')
