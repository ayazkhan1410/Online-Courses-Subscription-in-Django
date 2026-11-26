from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient


@override_settings(
    GOOGLE_OAUTH_CLIENT_ID='client.apps.googleusercontent.com',
    STRIPE_PUBLISHABLE_KEY='pk_test_x',
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
    },
)
class ConfigAPITests(TestCase):
    def test_config_exposes_google_client_id(self):
        client = APIClient()
        response = client.get('/api/config/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['google_client_id'],
            'client.apps.googleusercontent.com',
        )
        self.assertEqual(response.data['stripe_publishable_key'], 'pk_test_x')
