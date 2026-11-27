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
        progress = LessonProgress.objects.get(
            user=self.user, module=self.module
        )
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

    def test_save_position_and_resume_rules(self):
        from utils.learning import resume_seconds, save_lesson_position

        Enrollment.objects.create(user=self.user, course=self.course)
        self.module.duration_seconds = 600
        self.module.save(update_fields=['duration_seconds'])

        response = self.client.post(
            '/api/learning/progress/position/',
            {'module_id': self.module.id, 'seconds': 120},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['position_seconds'], 120)
        progress = LessonProgress.objects.get(
            user=self.user, module=self.module
        )
        self.assertEqual(progress.position_seconds, 120)
        self.assertFalse(progress.completed)

        # Last 15s of a 600s video → resume at 0
        self.assertEqual(resume_seconds(590, 600), 0)
        self.assertEqual(resume_seconds(580, 600), 577)
        self.assertEqual(resume_seconds(10, 600), 7)
        self.assertEqual(resume_seconds(2, 600), 0)

        # 90% of 600 = 540 → auto-complete
        save_lesson_position(self.user, self.module.id, 540)
        progress.refresh_from_db()
        self.assertTrue(progress.completed)
        self.assertEqual(progress.position_seconds, 540)

    def test_position_requires_enrollment(self):
        response = self.client.post(
            '/api/learning/progress/position/',
            {'module_id': self.module.id, 'seconds': 12},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_notes_owner_only(self):
        Enrollment.objects.create(user=self.user, course=self.course)
        created = self.client.post(
            f'/api/modules/{self.module.id}/notes/',
            {'seconds': 252, 'body': 'Lists tip'},
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        note_id = created.data['id']

        listed = self.client.get(f'/api/modules/{self.module.id}/notes/')
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listed.data), 1)

        other = CustomUser.objects.create_user(
            email='other@example.com',
            username='other',
            password='StrongPass123',
            full_name='Other',
            user_choices='expert',
        )
        other_token = Token.objects.create(user=other)
        outsider = APIClient()
        outsider.credentials(
            HTTP_AUTHORIZATION=f'Token {other_token.key}'
        )
        Enrollment.objects.create(user=other, course=self.course)
        forbidden = outsider.patch(
            f'/api/notes/{note_id}/',
            {'body': 'hacked'},
            format='json',
        )
        self.assertEqual(forbidden.status_code, status.HTTP_404_NOT_FOUND)
        deleted = outsider.delete(f'/api/notes/{note_id}/')
        self.assertEqual(deleted.status_code, status.HTTP_404_NOT_FOUND)

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
