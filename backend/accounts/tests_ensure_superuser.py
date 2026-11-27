import os
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from accounts.models import CustomUser


class EnsureSuperuserTests(TestCase):
    def test_creates_superuser_once(self):
        env = {
            'DJANGO_SUPERUSER_USERNAME': 'admin',
            'DJANGO_SUPERUSER_EMAIL': 'admin@example.com',
            'DJANGO_SUPERUSER_PASSWORD': 'VeryStrongAdminPass1',
        }
        with patch.dict(os.environ, env, clear=False):
            call_command('ensure_superuser')
        user = CustomUser.objects.get(email='admin@example.com')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertTrue(user.check_password('VeryStrongAdminPass1'))

        user.set_password('ChangedLaterPass99')
        user.save(update_fields=['password'])
        with patch.dict(os.environ, env, clear=False):
            call_command('ensure_superuser')
        user.refresh_from_db()
        self.assertTrue(user.check_password('ChangedLaterPass99'))
        self.assertEqual(
            CustomUser.objects.filter(email='admin@example.com').count(),
            1,
        )

    def test_skips_when_env_incomplete(self):
        env = {
            'DJANGO_SUPERUSER_USERNAME': '',
            'DJANGO_SUPERUSER_EMAIL': '',
            'DJANGO_SUPERUSER_PASSWORD': '',
        }
        with patch.dict(os.environ, env, clear=False):
            call_command('ensure_superuser')
        self.assertFalse(CustomUser.objects.filter(is_superuser=True).exists())
