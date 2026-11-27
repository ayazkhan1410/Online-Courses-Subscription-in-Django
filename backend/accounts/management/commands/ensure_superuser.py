"""Create the admin user once from environment variables."""

from __future__ import annotations

import logging

from django.core.management.base import BaseCommand

from accounts.models import CustomUser

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        'Create a superuser from DJANGO_SUPERUSER_* env vars if missing. '
        'Never resets an existing password.'
    )

    def handle(self, *args, **options):
        username = (self._env('DJANGO_SUPERUSER_USERNAME') or '').strip()
        email = (self._env('DJANGO_SUPERUSER_EMAIL') or '').strip().lower()
        password = self._env('DJANGO_SUPERUSER_PASSWORD') or ''

        if not username or not email or not password:
            logger.info(
                'ensure_superuser skipped: DJANGO_SUPERUSER_* incomplete'
            )
            return

        if CustomUser.objects.filter(email__iexact=email).exists():
            logger.info(
                'ensure_superuser: user already exists, leaving password alone'
            )
            return

        if CustomUser.objects.filter(username=username).exists():
            logger.info(
                'ensure_superuser: username already taken, skipping create'
            )
            return

        user = CustomUser(
            username=username,
            email=email,
            full_name=username[:40],
            user_choices='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            email_verified=True,
        )
        user.set_password(password)
        user.save()
        logger.info('ensure_superuser: created admin for %s', email)

    @staticmethod
    def _env(name: str) -> str | None:
        import os

        return os.getenv(name)
