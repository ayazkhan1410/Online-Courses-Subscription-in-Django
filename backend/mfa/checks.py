"""Refuse to boot outside DEBUG with a missing or invalid MFA key."""

import sys

from django.conf import settings
from django.core import checks


def _running_tests() -> bool:
    return 'test' in sys.argv


@checks.register()
def check_mfa_encryption_key(app_configs, **kwargs):
    if settings.DEBUG or _running_tests():
        return []
    from mfa.utils.crypto import check_key

    try:
        check_key()
    except Exception:
        return [
            checks.Error(
                'MFA_ENCRYPTION_KEY is missing or not a valid Fernet key.',
                hint=(
                    'Generate one with: python -c "from cryptography.fernet '
                    'import Fernet; print(Fernet.generate_key().decode())"'
                ),
                id='mfa.E001',
            )
        ]
    return []
