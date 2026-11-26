from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from contact.views import ContactCreateAPIView

_TURNSTILE = {'turnstile_token': 'test-token'}


@override_settings(TURNSTILE_TEST_MODE=True)
class ContactAPITests(TestCase):
    def setUp(self):
        cache.clear()

    def test_contact_throttle_scope(self):
        self.assertEqual(ContactCreateAPIView.throttle_scope, 'contact')

    def test_contact_create(self):
        client = APIClient()
        response = client.post(
            '/api/contact/',
            {
                'name': 'Ayaz',
                'email': 'ayaz@example.com',
                'message': 'Hello from the desk',
                **_TURNSTILE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


@override_settings(TURNSTILE_TEST_MODE=True)
class ContactThrottleTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_contact_throttle(self):
        client = APIClient()
        payload = {
            'name': 'Ayaz',
            'email': 'ayaz@example.com',
            'message': 'Hello from the desk',
            **_TURNSTILE,
        }
        # Production rate is contact=5/min.
        for _ in range(5):
            self.assertEqual(
                client.post('/api/contact/', payload, format='json').status_code,
                status.HTTP_201_CREATED,
            )
        limited = client.post('/api/contact/', payload, format='json')
        self.assertEqual(limited.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
