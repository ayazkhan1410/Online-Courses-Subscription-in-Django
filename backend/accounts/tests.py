from unittest.mock import patch

from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import CustomUser

_TURNSTILE = {'turnstile_token': 'test-token'}


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    GOOGLE_OAUTH_CLIENT_ID='test-google-client.apps.googleusercontent.com',
    TURNSTILE_TEST_MODE=True,
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
        'DEFAULT_PAGINATION_CLASS': ('rest_framework.pagination.PageNumberPagination'),
        'PAGE_SIZE': 8,
    },
)
class AuthAPITests(TestCase):
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

    def test_login_success(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'learner@example.com',
                'password': 'StrongPass123',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'learner@example.com')

    def test_login_invalid_credentials_single_error(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'learner@example.com',
                'password': 'wrong',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['non_field_errors'][0],
            'Invalid email or password',
        )

    def test_login_unknown_email_same_error(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'missing@example.com',
                'password': 'whatever',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['non_field_errors'][0],
            'Invalid email or password',
        )

    def test_register_rejects_weak_password(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'weak',
                'email': 'weak@example.com',
                'password': '123',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_success(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'fresh',
                'email': 'fresh@example.com',
                'password': 'StrongPass123',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(email='fresh@example.com').exists())

    def test_model_has_no_profile_or_confirm_password(self):
        field_names = {f.name for f in CustomUser._meta.get_fields()}
        self.assertNotIn('confirm_password', field_names)
        self.assertNotIn('profile', field_names)
        self.assertIn('google_sub', field_names)

    def test_forget_password_always_200(self):
        known = self.client.post(
            '/api/auth/forget-password/',
            {'email': 'learner@example.com', **_TURNSTILE},
            format='json',
        )
        unknown = self.client.post(
            '/api/auth/forget-password/',
            {'email': 'nobody@example.com', **_TURNSTILE},
            format='json',
        )
        self.assertEqual(known.status_code, status.HTTP_200_OK)
        self.assertEqual(unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_password_reset_token_format_and_change(self):
        self.client.post(
            '/api/auth/forget-password/',
            {'email': 'learner@example.com', **_TURNSTILE},
            format='json',
        )
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        self.assertIn('token=', body)
        token = body.split('token=')[1].strip()
        self.assertIn('.', token)
        uidb64, raw = token.split('.', 1)
        self.assertEqual(
            uidb64,
            urlsafe_base64_encode(force_bytes(self.user.pk)),
        )
        self.assertTrue(default_token_generator.check_token(self.user, raw))
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'token': token,
                'password': 'NewStrongPass123',
                'confirm_password': 'NewStrongPass123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass123'))

    def test_change_password_rejects_weak_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        raw = default_token_generator.make_token(self.user)
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'token': f'{uid}.{raw}',
                'password': '123',
                'confirm_password': '123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    @patch('utils.auth.google_id_token.verify_oauth2_token')
    def test_google_auth_creates_user(self, mock_verify):
        mock_verify.return_value = {
            'email': 'google.new@example.com',
            'email_verified': True,
            'iss': 'https://accounts.google.com',
            'sub': 'google-sub-1',
            'name': 'Google New',
        }
        response = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        user = CustomUser.objects.get(email='google.new@example.com')
        self.assertEqual(user.google_sub, 'google-sub-1')
        self.assertFalse(user.has_usable_password())

    @patch('utils.auth.google_id_token.verify_oauth2_token')
    def test_google_auth_existing_email_no_duplicate(self, mock_verify):
        mock_verify.return_value = {
            'email': 'learner@example.com',
            'email_verified': True,
            'iss': 'accounts.google.com',
            'sub': 'google-sub-existing',
            'name': 'Learner',
        }
        response = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CustomUser.objects.filter(email__iexact='learner@example.com').count(),
            1,
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.google_sub, 'google-sub-existing')

    @patch('utils.auth.google_id_token.verify_oauth2_token')
    def test_google_auth_unverified_email(self, mock_verify):
        mock_verify.return_value = {
            'email': 'bad@example.com',
            'email_verified': False,
            'iss': 'accounts.google.com',
            'sub': 'google-sub-bad',
        }
        response = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('utils.auth.google_id_token.verify_oauth2_token')
    def test_google_auth_invalid_token(self, mock_verify):
        mock_verify.side_effect = ValueError('bad token')
        response = self.client.post(
            '/api/auth/google/',
            {'credential': 'fake-token'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_auth_views_have_throttle_scope(self):
        from accounts.views import (
            ForgetPasswordAPIView,
            GoogleAuthAPIView,
            LoginAPIView,
            RegisterAPIView,
        )

        for view in (
            RegisterAPIView,
            LoginAPIView,
            GoogleAuthAPIView,
            ForgetPasswordAPIView,
        ):
            self.assertEqual(view.throttle_scope, 'auth')


@override_settings(TURNSTILE_TEST_MODE=True)
class AuthThrottleTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_auth_throttle_kicks_in(self):
        client = APIClient()
        # Production rate is auth=10/min (class attr; override_settings rates
        # do not reload SimpleRateThrottle.THROTTLE_RATES).
        for _ in range(10):
            client.post(
                '/api/auth/login/',
                {'email': 'x@example.com', 'password': 'nope', **_TURNSTILE},
                format='json',
            )
        response = client.post(
            '/api/auth/login/',
            {'email': 'x@example.com', 'password': 'nope', **_TURNSTILE},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
