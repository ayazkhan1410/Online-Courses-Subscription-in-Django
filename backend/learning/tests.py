from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from learning.models import Enrollment, LessonProgress
from subscriptions.models import Subscription, SubscriptionList
from utils.subscriptions import upgrade_to_pro


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_THROTTLE_CLASSES': [],
        'PAGE_SIZE': 8,
    },
    STRIPE_SECRET_KEY='sk_test',
)
class LearningAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='learn@example.com',
            username='learn',
            password='StrongPass123',
            full_name='Learn',
            user_choices='expert',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.course = Courses.objects.create(
            courses_name='Python Desk',
            courses_description='desc',
            is_premium=False,
            youtube_playlist_id='py-desk',
            slug='python-desk',
        )
        self.module = CourseModule.objects.create(
            course=self.course,
            module_name='Day 1',
            youtube_video_id='abc123',
            module_video='https://www.youtube.com/watch?v=abc123',
            sort_order=1,
        )

    def test_progress_boolean_field_parses_string_false(self):
        Enrollment.objects.create(user=self.user, course=self.course)
        response = self.client.post(
            f'/api/modules/{self.module.id}/progress/',
            {'completed': 'false'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['completed'])
        progress = LessonProgress.objects.get(user=self.user, module=self.module)
        self.assertFalse(progress.completed)

    def test_progress_requires_enrollment(self):
        response = self.client.post(
            f'/api/modules/{self.module.id}/progress/',
            {'completed': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_requires_auth(self):
        anon = APIClient()
        response = anon.get('/api/dashboard/')
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_upgrade_to_pro_get_or_create_defaults(self):
        plan = SubscriptionList.objects.create(
            subscription_list='Pro',
            subscription_price=99,
        )
        with self.settings(STRIPE_SECRET_KEY='sk_test'):
            from unittest.mock import MagicMock, patch

            fake_charge = {'paid': True}
            with (
                patch('utils.subscriptions.stripe.Customer.create') as cust,
                patch('utils.subscriptions.stripe.Charge.create') as charge,
            ):
                cust.return_value = MagicMock(id='cus_1')
                charge.return_value = fake_charge
                upgrade_to_pro(self.user, plan.id, 'tok_visa')
        sub = Subscription.objects.get(user=self.user)
        self.assertTrue(sub.is_pro)
        self.assertEqual(sub.subscription_list_id, plan.id)
