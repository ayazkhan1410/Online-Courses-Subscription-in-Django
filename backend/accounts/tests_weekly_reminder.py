from datetime import timedelta

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from learning.models import Enrollment, LessonProgress


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='noreply@example.com',
    FRONTEND_URL='http://localhost:4780',
    API_PUBLIC_URL='http://localhost:4781/api',
)
class WeeklyReminderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='weekly@example.com',
            username='weekly',
            password='StrongPass123',
            full_name='Weekly',
            user_choices='expert',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}',
        )
        self.course = Courses.objects.create(
            courses_name='Python Desk',
            courses_description='desc',
            is_premium=False,
            youtube_playlist_id='py-weekly',
            slug='python-weekly',
        )
        self.module = CourseModule.objects.create(
            course=self.course,
            module_name=(
                'Day 08/50 - Lists in Python | Python Full Course'
            ),
            youtube_video_id='vid08',
            module_video='https://www.youtube.com/watch?v=vid08',
            sort_order=8,
        )
        Enrollment.objects.create(user=self.user, course=self.course)

    def test_weekly_email_defaults_off_and_opt_in_via_settings(self):
        self.user.refresh_from_db()
        self.assertFalse(self.user.weekly_email)
        self.assertTrue(self.user.unsubscribe_token)

        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['weekly_email'])

        patch = self.client.patch(
            '/api/auth/me/',
            {'weekly_email': True},
            format='json',
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertTrue(patch.data['weekly_email'])
        self.user.refresh_from_db()
        self.assertTrue(self.user.weekly_email)

    def test_sends_when_opted_in_and_idle_three_days(self):
        self.user.weekly_email = True
        self.user.save()
        mail.outbox.clear()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(
            message.subject,
            'Your next lesson: Lists in python',
        )
        self.assertIn('Python Desk', message.body)
        self.assertIn('Day 08 of 50', message.body)
        self.assertIn('/learn/python-weekly/', message.body)
        self.assertIn('List-Unsubscribe', message.extra_headers)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_reminder_at)

    def test_skips_when_not_opted_in(self):
        mail.outbox.clear()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 0)

    def test_skips_when_lesson_completed_within_three_days(self):
        module_two = CourseModule.objects.create(
            course=self.course,
            module_name='Day 09/50 - List methods',
            youtube_video_id='vid09',
            module_video='https://www.youtube.com/watch?v=vid09',
            sort_order=9,
        )
        self.user.weekly_email = True
        self.user.save()
        LessonProgress.objects.create(
            user=self.user,
            module=module_two,
            completed=True,
        )
        mail.outbox.clear()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 0)

    def test_at_most_one_email_per_seven_days(self):
        self.user.weekly_email = True
        self.user.last_reminder_at = timezone.now() - timedelta(days=2)
        self.user.save()
        mail.outbox.clear()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 0)

        self.user.last_reminder_at = timezone.now() - timedelta(days=8)
        self.user.save()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 1)

    def test_unsubscribe_turns_off_weekly_email(self):
        self.user.weekly_email = True
        self.user.save()
        token = self.user.unsubscribe_token
        anon = APIClient()
        response = anon.get(f'/api/email/unsubscribe/{token}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.weekly_email)

        mail.outbox.clear()
        call_command('send_weekly_reminders')
        self.assertEqual(len(mail.outbox), 0)
