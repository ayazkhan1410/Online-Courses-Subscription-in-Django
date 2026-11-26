import secrets

from django.conf import settings
from django.db import models


def generate_challenge_token() -> str:
    return secrets.token_urlsafe(32)


class Authenticator(models.Model):
    """One TOTP secret per user. Usable only after confirmed_at is set."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='authenticator',
    )
    secret_encrypted = models.TextField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    last_used_step = models.PositiveBigIntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return f'Authenticator of user {self.user_id}'


class LoginChallenge(models.Model):
    """Pending second step after a correct password or Google sign-in."""

    class Method(models.TextChoices):
        TOTP = 'totp', 'Authenticator app'
        EMAIL = 'email', 'Email'
        RECOVERY = 'recovery', 'Recovery code'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='login_challenges',
    )
    method = models.CharField(max_length=16, choices=Method.choices)
    code_hash = models.CharField(max_length=64, blank=True, default='')
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
    token = models.CharField(
        max_length=64,
        unique=True,
        default=generate_challenge_token,
    )

    def __str__(self) -> str:
        return f'Login challenge {self.pk} of user {self.user_id}'


class RecoveryCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recovery_codes',
    )
    code_hash = models.CharField(max_length=64)
    used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f'Recovery code {self.pk} of user {self.user_id}'
