from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from learning.models import Enrollment
from subscriptions.models import Subscription, SubscriptionList


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_THROTTLE_CLASSES': [],
        'PAGE_SIZE': 8,
    }
)
class CourseLockAndSeedTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='student@example.com',
            username='student',
            password='StrongPass123',
            full_name='Student',
            user_choices='expert',
        )
        self.token = Token.objects.create(user=self.user)
        self.free = Courses.objects.create(
            courses_name='Free Course',
            courses_description='Free',
            is_premium=False,
            youtube_playlist_id='free-pl',
            slug='free-course',
        )
        self.premium = Courses.objects.create(
            courses_name='Premium Course',
            courses_description='Pro',
            is_premium=True,
            youtube_playlist_id='pro-pl',
            slug='premium-course',
        )
        self.free_mod = CourseModule.objects.create(
            course=self.free,
            module_name='Free lesson',
            module_video='https://www.youtube.com/watch?v=free123',
            youtube_video_id='free123',
            thumbnail_url='https://img.example/free.jpg',
            sort_order=1,
        )
        self.pro_mod = CourseModule.objects.create(
            course=self.premium,
            module_name='Pro lesson',
            module_video='https://www.youtube.com/watch?v=pro123',
            youtube_video_id='pro123',
            thumbnail_url='https://img.example/pro.jpg',
            sort_order=1,
        )

    def test_anonymous_modules_are_locked(self):
        response = self.client.get('/api/courses/free-course/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        module = response.data['course_modules'][0]
        self.assertTrue(module['is_locked'])
        self.assertIsNone(module['module_video'])
        self.assertIsNone(module['embed_url'])
        self.assertIsNone(module['youtube_video_id'])
        self.assertIsNone(module['thumbnail_url'])

    def test_enrolled_free_modules_unlocked(self):
        Enrollment.objects.create(user=self.user, course=self.free)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/courses/free-course/')
        module = response.data['course_modules'][0]
        self.assertFalse(module['is_locked'])
        self.assertEqual(module['youtube_video_id'], 'free123')
        self.assertIn('embed', module['embed_url'])

    def test_premium_locked_without_pro(self):
        Enrollment.objects.create(user=self.user, course=self.premium)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/courses/premium-course/')
        module = response.data['course_modules'][0]
        self.assertTrue(module['is_locked'])
        self.assertIsNone(module['module_video'])

    def test_premium_unlocked_for_pro_enrolled(self):
        plan = SubscriptionList.objects.create(
            subscription_list='Monthly',
            subscription_price=10,
        )
        Subscription.objects.create(
            user=self.user,
            subscription_list=plan,
            is_pro=True,
        )
        Enrollment.objects.create(user=self.user, course=self.premium)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/courses/premium-course/')
        module = response.data['course_modules'][0]
        self.assertFalse(module['is_locked'])
        self.assertEqual(module['youtube_video_id'], 'pro123')

    def test_seeder_keeps_enrolled_placeholder_courses(self):
        # Multiple NULLs are allowed under the unique playlist constraint.
        placeholder = Courses.objects.create(
            courses_name='Legacy Placeholder',
            courses_description='old',
            youtube_playlist_id=None,
            slug='legacy-placeholder',
        )
        Enrollment.objects.create(user=self.user, course=placeholder)
        orphan = Courses.objects.create(
            courses_name='Orphan Placeholder',
            courses_description='old',
            youtube_playlist_id=None,
            slug='orphan-placeholder',
        )
        call_command('seed_youtube_courses')
        self.assertTrue(Courses.objects.filter(pk=placeholder.pk).exists())
        self.assertFalse(Courses.objects.filter(pk=orphan.pk).exists())
