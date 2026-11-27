"""Authenticator app: setup, QR, and one-time TOTP steps (valid_window=1)."""

import hmac
import io
import logging
import time

import pyotp
import qrcode
import qrcode.image.svg
from django.db import transaction
from django.utils import timezone

from mfa.exceptions import MfaError
from mfa.models import Authenticator
from mfa.utils.alerts import send_security_alert
from mfa.utils.code import issue_recovery_codes
from mfa.utils.crypto import EncryptionError, decrypt_text, encrypt_text

logger = logging.getLogger(__name__)

ISSUER = 'Online Courses'


def matching_step(
    secret: str, code: str, last_used_step: int | None
) -> int | None:
    """30-second step for this code, or None.

    The step before and after now are accepted (valid_window=1). A step at or
    before last_used_step is refused so a code works only once.
    """
    cleaned = code.strip().replace(' ', '')
    if not (cleaned.isascii() and cleaned.isdigit() and len(cleaned) == 6):
        return None
    totp = pyotp.TOTP(secret)
    now_step = int(time.time()) // totp.interval
    last = -1 if last_used_step is None else last_used_step
    for step in (now_step - 1, now_step, now_step + 1):
        if step > last and hmac.compare_digest(
            totp.at(step * totp.interval),
            cleaned,
        ):
            return step
    return None


def _qr_svg(data: str) -> str:
    image = qrcode.make(data, image_factory=qrcode.image.svg.SvgPathImage)
    buffer = io.BytesIO()
    image.save(buffer)
    return buffer.getvalue().decode()


def start_setup(user) -> dict:
    if getattr(user, 'mfa_method', ''):
        raise MfaError('Two-factor authentication is already enabled.')
    secret = pyotp.random_base32()
    Authenticator.objects.update_or_create(
        user=user,
        defaults={
            'secret_encrypted': encrypt_text(secret),
            'confirmed_at': None,
            'last_used_step': None,
        },
    )
    otpauth_url = pyotp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name=ISSUER,
    )
    return {
        'otpauth_url': otpauth_url,
        'qr_svg': _qr_svg(otpauth_url),
        'manual_key': secret,
    }


def confirm_setup(user, code: str) -> list[str]:
    with transaction.atomic():
        authenticator = (
            Authenticator.objects.select_for_update()
            .filter(user=user, confirmed_at__isnull=True)
            .first()
        )
        if authenticator is None:
            raise MfaError('Start setup before confirming.')
        try:
            secret = decrypt_text(authenticator.secret_encrypted)
        except EncryptionError:
            logger.error(
                'MFA setup secret cannot be decrypted | user_id=%s', user.pk
            )
            raise MfaError('Setup expired. Start again.') from None
        step = matching_step(secret, code, None)
        if step is None:
            raise MfaError('Invalid code.')
        authenticator.confirmed_at = timezone.now()
        authenticator.last_used_step = step
        authenticator.save(update_fields=['confirmed_at', 'last_used_step'])
        user.mfa_method = user.MFA_TOTP
        user.save(update_fields=['mfa_method'])
        codes = issue_recovery_codes(user)
    send_security_alert(user, 'enabled')
    logger.info('MFA enabled | user_id=%s', user.pk)
    return codes


def consume_totp(user, code: str) -> bool:
    with transaction.atomic():
        authenticator = (
            Authenticator.objects.select_for_update()
            .filter(user=user, confirmed_at__isnull=False)
            .first()
        )
        if authenticator is None:
            return False
        try:
            secret = decrypt_text(authenticator.secret_encrypted)
        except EncryptionError:
            logger.error(
                'MFA secret cannot be decrypted | user_id=%s', user.pk
            )
            return False
        step = matching_step(secret, code, authenticator.last_used_step)
        if step is None:
            return False
        authenticator.last_used_step = step
        authenticator.save(update_fields=['last_used_step'])
    return True
