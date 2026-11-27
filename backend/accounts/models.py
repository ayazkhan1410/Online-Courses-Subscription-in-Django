from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    MFA_NONE = ''
    MFA_TOTP = 'totp'
    MFA_EMAIL = 'email'
    MFA_METHOD_CHOICES = [
        (MFA_NONE, 'Off'),
        (MFA_TOTP, 'Authenticator app'),
        (MFA_EMAIL, 'Email code'),
    ]

    username = models.CharField(max_length=40, null=True, blank=True)
    full_name = models.CharField(max_length=40)
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=16,
        choices=MFA_METHOD_CHOICES,
        blank=True,
        default=MFA_NONE,
    )
    # Password hashes need >40 chars (Postgres length).
    password = models.CharField(max_length=128)
    google_sub = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )
    user_choices = models.CharField(
        max_length=30,
        choices=[
            ('expert', 'Expert'),
            ('business', 'Business'),
            ('admin', 'Admin'),
        ],
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return f'{self.email}'


class EmailVerificationCode(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='email_verification_codes',
    )
    email = models.EmailField()
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Email code for {self.email}'
