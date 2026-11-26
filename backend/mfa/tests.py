import re
import time
from datetime import timedelta
from unittest.mock import patch

import pyotp
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from mfa.models import Authenticator, LoginChallenge, RecoveryCode
from mfa.views import MfaVerifyAPIView

TEST_MFA_KEY = '6nWjYqwDI8o0yifVirtAMlrGWAOF04P4vci8ZuywHKI='
_TURNSTILE = {'turnstile_token': 'test-token'}


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    MFA_ENCRYPTION_KEY=TEST_MFA_KEY,
    TURNSTILE_TEST_MODE=True,
    GOOGLE_OAUTH_CLIENT_ID='test-google-client.apps.googleusercontent.com',
)
class MfaApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='learner@example.com',
            username='learner',
            password='StrongPass123',
            full_name='Learner',
            user_choices='expert',
        )
        self.secret = ''
        self.recovery: list[str] = []

    def _login(self, email: str | None = None, password: str = 'StrongPass123'):
        return self.client.post(
            '/api/auth/login/',
            {
                'email': email or self.user.email,
                'password': password,
                **_TURNSTILE,
            },
            format='json',
        )

    def _auth(self, token: str) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

    def _enable(self) -> None:
        login = self._login()
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('token', login.data)
        self._auth(login.data['token'])
        setup = self.client.post('/api/auth/mfa/setup/', format='json')
        self.assertEqual(setup.status_code, status.HTTP_200_OK)
        self.secret = setup.data['manual_key']
        confirm = self.client.post(
            '/api/auth/mfa/confirm/',
            {'code': pyotp.TOTP(self.secret).now()},
            format='json',
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        self.recovery = confirm.data['recovery_codes']
        self._auth(confirm.data['token'])

    def _unused_code(self, secret: str | None = None) -> str:
        totp = pyotp.TOTP(secret or self.secret)
        now_step = int(time.time()) // totp.interval
        last = (
            Authenticator.objects.filter(user=self.user)
            .values_list(
                'last_used_step',
                flat=True,
            )
            .first()
        )
        floor = -1 if last is None else last
        for step in (now_step + 1, now_step, now_step - 1):
            if step > floor:
                return totp.at(step * totp.interval)
        self.fail('no unused TOTP step')
        return ''

    def _verify(self, challenge_token: str, code: str, method: str):
        return self.client.post(
            '/api/auth/mfa/verify/',
            {
                'challenge_token': challenge_token,
                'code': code,
                'method': method,
            },
            format='json',
        )

    def test_verify_throttle_scope(self):
        self.assertEqual(MfaVerifyAPIView.throttle_scope, 'mfa')

    def test_setup_and_confirm(self):
        login = self._login()
        self._auth(login.data['token'])
        setup = self.client.post('/api/auth/mfa/setup/', format='json')
        self.assertEqual(setup.status_code, status.HTTP_200_OK)
        self.assertIn(setup.data['manual_key'], setup.data['otpauth_url'])
        self.assertIn('<svg', setup.data['qr_svg'])
        self.secret = setup.data['manual_key']
        confirm = self.client.post(
            '/api/auth/mfa/confirm/',
            {'code': pyotp.TOTP(self.secret).now()},
            format='json',
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        self.recovery = confirm.data['recovery_codes']
        self._auth(confirm.data['token'])
        self.assertEqual(len(self.recovery), 8)
        self.assertEqual(len(set(self.recovery)), 8)
        row = Authenticator.objects.get(user=self.user)
        self.assertIsNotNone(row.confirmed_at)
        self.assertNotEqual(row.secret_encrypted, self.secret)
        status_response = self.client.get('/api/auth/mfa/status/')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertTrue(status_response.data['enabled'])
        self.assertEqual(status_response.data['recovery_codes_remaining'], 8)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Two-factor authentication is on')
        for code in self.recovery:
            self.assertNotIn(code, mail.outbox[0].body)

    def test_login_returns_challenge_without_token(self):
        self._enable()
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['mfa_required'])
        self.assertIn('challenge_token', response.data)
        self.assertIn('totp', response.data['methods'])
        self.assertNotIn('token', response.data)

    def test_verify_correct_code(self):
        self._enable()
        login = self._login()
        response = self._verify(
            login.data['challenge_token'],
            self._unused_code(),
            'totp',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_verify_incorrect_code(self):
        self._enable()
        login = self._login()
        response = self._verify(login.data['challenge_token'], '000000', 'totp')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', response.data)

    def test_totp_replay_is_rejected(self):
        self._enable()
        code = self._unused_code()
        first = self._login()
        ok = self._verify(first.data['challenge_token'], code, 'totp')
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        second = self._login()
        replay = self._verify(second.data['challenge_token'], code, 'totp')
        self.assertEqual(replay.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', replay.data)

    def test_expired_challenge(self):
        self._enable()
        login = self._login()
        challenge = LoginChallenge.objects.get(token=login.data['challenge_token'])
        challenge.expires_at = timezone.now() - timedelta(seconds=5)
        challenge.save(update_fields=['expires_at'])
        response = self._verify(
            challenge.token,
            self._unused_code(),
            'totp',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', response.data)

    def test_five_attempts_lock_the_challenge(self):
        self._enable()
        login = self._login()
        token = login.data['challenge_token']
        for _ in range(5):
            wrong = self._verify(token, '000000', 'totp')
            self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)
        blocked = self._verify(token, self._unused_code(), 'totp')
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', blocked.data)
        self.assertEqual(
            LoginChallenge.objects.get(token=token).attempts,
            5,
        )

    def test_recovery_code_works_once(self):
        self._enable()
        code = self.recovery[0]
        first = self._login()
        ok = self._verify(first.data['challenge_token'], code, 'recovery')
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertIn('token', ok.data)
        second = self._login()
        again = self._verify(second.data['challenge_token'], code, 'recovery')
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('token', again.data)
        self.assertEqual(
            RecoveryCode.objects.filter(user=self.user, used_at__isnull=False).count(),
            1,
        )

    def test_disable_with_password(self):
        self._enable()
        wrong = self.client.post(
            '/api/auth/mfa/disable/',
            {'password': 'not-the-password'},
            format='json',
        )
        self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(
            Authenticator.objects.filter(
                user=self.user,
                confirmed_at__isnull=False,
            ).exists()
        )
        disabled = self.client.post(
            '/api/auth/mfa/disable/',
            {'password': 'StrongPass123'},
            format='json',
        )
        self.assertEqual(disabled.status_code, status.HTTP_200_OK)
        self.assertFalse(Authenticator.objects.filter(user=self.user).exists())
        self.assertEqual(RecoveryCode.objects.filter(user=self.user).count(), 0)
        login = self._login()
        self.assertIn('token', login.data)
        self.assertNotIn('mfa_required', login.data)

    @patch('utils.auth.google_id_token.verify_oauth2_token')
    def test_google_login_requires_mfa_after_setup(self, mock_verify):
        mock_verify.return_value = {
            'email': 'google.new@example.com',
            'email_verified': True,
            'iss': 'https://accounts.google.com',
            'sub': 'google-sub-mfa',
            'name': 'Google New',
        }
        created = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertIn('token', created.data)
        self._auth(created.data['token'])
        user = CustomUser.objects.get(email='google.new@example.com')
        self.user = user
        setup = self.client.post('/api/auth/mfa/setup/', format='json')
        self.secret = setup.data['manual_key']
        confirm = self.client.post(
            '/api/auth/mfa/confirm/',
            {'code': pyotp.TOTP(self.secret).now()},
            format='json',
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        self.client.credentials()
        again = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertTrue(again.data['mfa_required'])
        self.assertNotIn('token', again.data)
        verified = self._verify(
            again.data['challenge_token'],
            self._unused_code(),
            'totp',
        )
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertIn('token', verified.data)

    def test_resend_cooldown(self):
        self._enable()
        mail.outbox.clear()
        login = self._login()
        token = login.data['challenge_token']
        with self.assertLogs('mfa', level='INFO') as captured:
            first = self.client.post(
                '/api/auth/mfa/resend/',
                {'challenge_token': token},
                format='json',
            )
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        match = re.search(r'\b(\d{6})\b', mail.outbox[0].body)
        self.assertIsNotNone(match)
        code = match.group(1)
        self.assertNotIn(code, '\n'.join(captured.output))
        second = self.client.post(
            '/api/auth/mfa/resend/',
            {'challenge_token': token},
            format='json',
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 1)
        verified = self._verify(token, code, 'email')
        self.assertEqual(verified.status_code, status.HTTP_200_OK)

    def test_staff_without_authenticator_gets_email_code(self):
        staff = CustomUser.objects.create_user(
            email='staff@example.com',
            username='staff',
            password='StrongPass123',
            full_name='Staff',
            user_choices='admin',
        )
        staff.is_staff = True
        staff.save(update_fields=['is_staff'])
        with self.assertLogs('mfa', level='INFO') as captured:
            login = self._login(email='staff@example.com')
        self.assertTrue(login.data['mfa_required'])
        self.assertEqual(login.data['methods'], ['email'])
        self.assertNotIn('token', login.data)
        self.assertEqual(len(mail.outbox), 1)
        code = re.search(r'\b(\d{6})\b', mail.outbox[0].body).group(1)
        self.assertNotIn(code, '\n'.join(captured.output))
        verified = self._verify(login.data['challenge_token'], code, 'email')
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertIn('token', verified.data)
        self.assertTrue(Token.objects.filter(user=staff).exists())
