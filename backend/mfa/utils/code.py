"""Keyed hashes for emailed codes and one-time recovery codes."""

import secrets

from django.db import transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from mfa.models import RecoveryCode

OTP_LENGTH = 6
RECOVERY_COUNT = 8
_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def generate_login_code() -> str:
    """Random 6-digit code. Leading zeros are allowed."""
    return f'{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}'


def hash_value(value: str, purpose: str) -> str:
    """SECRET_KEY-keyed hash; a leaked table cannot be brute-forced."""
    return salted_hmac(f'mfa.{purpose}', value, algorithm='sha256').hexdigest()


def value_matches(value: str, stored: str, purpose: str) -> bool:
    if not stored:
        return False
    return constant_time_compare(hash_value(value, purpose), stored)


def normalize_recovery(code: str) -> str:
    return ''.join(ch for ch in code.upper() if ch.isalnum())


def _new_recovery_code() -> str:
    raw = ''.join(secrets.choice(_ALPHABET) for _ in range(8))
    return f'{raw[:4]}-{raw[4:]}'


def issue_recovery_codes(user) -> list[str]:
    """Replace previous codes. Plaintext returned once, not stored."""
    plaintext = [_new_recovery_code() for _ in range(RECOVERY_COUNT)]
    RecoveryCode.objects.filter(user=user).delete()
    RecoveryCode.objects.bulk_create(
        [
            RecoveryCode(
                user=user,
                code_hash=hash_value(normalize_recovery(code), 'recovery'),
            )
            for code in plaintext
        ]
    )
    return plaintext


def consume_recovery_code(user, code: str) -> bool:
    normalized = normalize_recovery(code)
    if len(normalized) < 8:
        return False
    digest = hash_value(normalized, 'recovery')
    with transaction.atomic():
        row = (
            RecoveryCode.objects.select_for_update()
            .filter(user=user, code_hash=digest, used_at__isnull=True)
            .first()
        )
        if row is None:
            return False
        row.used_at = timezone.now()
        row.save(update_fields=['used_at'])
    return True
