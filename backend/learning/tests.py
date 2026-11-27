from datetime import datetime, timedelta, timezone as dt_utc
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone as dj_tz
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from learning.models import Completion, Enrollment, LessonProgress
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


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_THROTTLE_CLASSES': [],
        'PAGE_SIZE': 8,
    },
)
class CompletionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='done@example.com',
            username='done',
            password='StrongPass123',
            full_name='Done User',
            user_choices='expert',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.course = Courses.objects.create(
            courses_name='Two Step Python',
            courses_description='desc',
            is_premium=False,
            youtube_playlist_id='two-step',
            slug='two-step',
        )
        self.mod_a = CourseModule.objects.create(
            course=self.course,
            module_name='Step 1',
            youtube_video_id='v1',
            module_video='https://www.youtube.com/watch?v=v1',
            sort_order=1,
        )
        self.mod_b = CourseModule.objects.create(
            course=self.course,
            module_name='Step 2',
            youtube_video_id='v2',
            module_video='https://www.youtube.com/watch?v=v2',
            sort_order=2,
        )
        Enrollment.objects.create(user=self.user, course=self.course)

    def _mark(self, module_id: int, completed: bool = True):
        return self.client.post(
            f'/api/modules/{module_id}/progress/',
            {'completed': completed},
            format='json',
        )

    def test_creates_completion_on_last_lesson(self):
        first = self._mark(self.mod_a.id)
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertIsNone(first.data.get('completion'))
        second = self._mark(self.mod_b.id)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertIn('completion', second.data)
        share_id = second.data['completion']['share_id']
        self.assertEqual(len(share_id), 10)
        self.assertEqual(Completion.objects.count(), 1)

    def test_keeps_completion_after_unmark(self):
        self._mark(self.mod_a.id)
        self._mark(self.mod_b.id)
        share_id = Completion.objects.get().share_id
        unmark = self._mark(self.mod_b.id, completed=False)
        self.assertEqual(unmark.status_code, status.HTTP_200_OK)
        self.assertTrue(Completion.objects.filter(share_id=share_id).exists())

    def test_hides_name_when_privacy_off(self):
        self._mark(self.mod_a.id)
        self._mark(self.mod_b.id)
        share_id = Completion.objects.get().share_id
        self.user.show_name_on_completion = False
        self.user.save(update_fields=['show_name_on_completion'])
        public = APIClient().get(f'/api/completions/{share_id}/')
        self.assertEqual(public.status_code, status.HTTP_200_OK)
        self.assertEqual(public.data['learner_name'], 'A learner')

    def test_og_png_endpoint(self):
        self._mark(self.mod_a.id)
        self._mark(self.mod_b.id)
        share_id = Completion.objects.get().share_id
        response = APIClient().get(f'/api/og/done/{share_id}.png')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'image/png')
        self.assertTrue(response.content.startswith(b'\x89PNG'))


class StreakTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='streak@example.com',
            username='streak',
            password='StrongPass123',
            full_name='Streak',
            user_choices='expert',
            timezone='America/New_York',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.course = Courses.objects.create(
            courses_name='Streak course',
            courses_description='desc',
            is_premium=False,
            youtube_playlist_id='stk',
            slug='streak-course',
        )
        self.modules = [
            CourseModule.objects.create(
                course=self.course,
                module_name=f'Lesson {n}',
                youtube_video_id=f'id{n}',
                module_video=f'https://www.youtube.com/watch?v=id{n}',
                sort_order=n,
            )
            for n in range(1, 6)
        ]
        Enrollment.objects.create(user=self.user, course=self.course)

    def _complete_at(self, module: CourseModule, when: datetime):
        row, _ = LessonProgress.objects.update_or_create(
            user=self.user,
            module=module,
            defaults={'completed': True},
        )
        LessonProgress.objects.filter(pk=row.pk).update(updated_at=when)
        return row

    def test_streak_counts_consecutive_local_days(self):
        tz = ZoneInfo('America/New_York')
        today_local = dj_tz.now().astimezone(tz).date()
        for offset, mod in enumerate(self.modules[:3]):
            day = today_local - timedelta(days=2 - offset)
            local_noon = datetime(
                day.year,
                day.month,
                day.day,
                12,
                0,
                tzinfo=tz,
            )
            when = local_noon.astimezone(dt_utc.utc)
            self._complete_at(mod, when)

        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['streak']['current'], 3)
        self.assertEqual(response.data['streak']['longest'], 3)

    def test_timezone_splits_completions_across_local_midnights(self):
        tz = ZoneInfo('America/New_York')
        day = dj_tz.now().astimezone(tz).date() - timedelta(days=1)
        late = datetime(day.year, day.month, day.day, 23, 30, tzinfo=tz)
        early = datetime(
            (day + timedelta(days=1)).year,
            (day + timedelta(days=1)).month,
            (day + timedelta(days=1)).day,
            0,
            30,
            tzinfo=tz,
        )
        self._complete_at(
            self.modules[0],
            late.astimezone(dt_utc.utc),
        )
        self._complete_at(
            self.modules[1],
            early.astimezone(dt_utc.utc),
        )
        from utils.streak import completion_counts_by_day

        counts = completion_counts_by_day(self.user)
        self.assertEqual(counts.get(day), 1)
        self.assertEqual(counts.get(day + timedelta(days=1)), 1)

    def test_daily_goal_two_needs_two_lessons(self):
        self.user.daily_goal = 2
        self.user.save(update_fields=['daily_goal'])
        tz = ZoneInfo('America/New_York')
        today = dj_tz.now().astimezone(tz).date()
        noon = datetime(
            today.year,
            today.month,
            today.day,
            14,
            0,
            tzinfo=tz,
        ).astimezone(dt_utc.utc)
        self._complete_at(self.modules[0], noon)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        today_cell = next(
            d for d in response.data['streak']['week'] if d['is_today']
        )
        self.assertFalse(today_cell['goal_met'])
        self._complete_at(self.modules[1], noon + timedelta(minutes=5))
        response = self.client.get('/api/dashboard/')
        today_cell = next(
            d for d in response.data['streak']['week'] if d['is_today']
        )
        self.assertTrue(today_cell['goal_met'])

    def test_me_patch_timezone_and_daily_goal(self):
        patch = self.client.patch(
            '/api/auth/me/',
            {'timezone': 'Asia/Karachi', 'daily_goal': 3},
            format='json',
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertEqual(patch.data['timezone'], 'Asia/Karachi')
        self.assertEqual(patch.data['daily_goal'], 3)
        self.user.refresh_from_db()
        self.assertEqual(self.user.timezone, 'Asia/Karachi')
