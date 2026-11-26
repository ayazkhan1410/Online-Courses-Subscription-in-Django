"""Fernet encryption for authenticator secrets.

MFA_ENCRYPTION_KEY may list several keys separated by commas. The first key
encrypts; every key can decrypt, so a key can be rotated by putting the new
one first and dropping the old one after secrets are re-saved.
"""

from cryptography.fernet import Fernet, InvalidToken, MultiFernet
from django.conf import settings


class EncryptionError(Exception):
    """The value could not be decrypted."""


def _fernet() -> MultiFernet:
    raw = getattr(settings, 'MFA_ENCRYPTION_KEY', '') or ''
    keys = [key.strip() for key in raw.split(',') if key.strip()]
    if not keys:
        raise EncryptionError('MFA_ENCRYPTION_KEY is empty.')
    return MultiFernet([Fernet(key) for key in keys])


def check_key() -> None:
    """Raise if the key is missing or not a Fernet key."""
    _fernet().encrypt(b'check')


def encrypt_text(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()


def decrypt_text(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, EncryptionError, ValueError, TypeError) as exc:
        raise EncryptionError('Could not decrypt the value.') from exc
