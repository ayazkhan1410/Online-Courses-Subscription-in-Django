from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase, override_settings

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from courses.services.playlist_sync import sync_course_playlist
from learning.models import LessonProgress


class PlaylistSyncTests(TestCase):
    def setUp(self):
        self.course = Courses.objects.create(
            courses_name='Sync course',
            courses_description='',
            youtube_playlist_id='PLsync01',
            slug='sync-course',
            status=Courses.STATUS_PUBLISHED,
        )
        self.mod_a = CourseModule.objects.create(
            course=self.course,
            module_name='Lesson A',
            module_video='https://www.youtube.com/watch?v=vidA',
            youtube_video_id='vidA',
            sort_order=0,
        )
        self.mod_b = CourseModule.objects.create(
            course=self.course,
            module_name='Lesson B',
            module_video='https://www.youtube.com/watch?v=vidB',
            youtube_video_id='vidB',
            sort_order=1,
        )
        self.user = CustomUser.objects.create_user(
            email='sync@example.com',
            username='sync',
            password='StrongPass123',
            full_name='Sync',
            user_choices='expert',
        )
        LessonProgress.objects.create(
            user=self.user,
            module=self.mod_a,
            completed=True,
        )

    @patch('courses.services.playlist_sync.fetch_playlist_videos')
    def test_sync_appends_new_without_reordering_progress_lessons(self, fetch):
        fetch.return_value = [
            {
                'youtube_video_id': 'vidA',
                'title': 'Lesson A',
                'thumbnail_url': '',
                'video_url': 'https://www.youtube.com/watch?v=vidA',
                'position': 0,
            },
            {
                'youtube_video_id': 'vidB',
                'title': 'Lesson B',
                'thumbnail_url': '',
                'video_url': 'https://www.youtube.com/watch?v=vidB',
                'position': 1,
            },
            {
                'youtube_video_id': 'vidC',
                'title': 'Lesson C',
                'thumbnail_url': '',
                'video_url': 'https://www.youtube.com/watch?v=vidC',
                'position': 2,
            },
        ]
        stats = sync_course_playlist(self.course, 'test-api-key')
        self.assertEqual(stats['added'], 1)
        self.mod_a.refresh_from_db()
        self.mod_b.refresh_from_db()
        self.assertEqual(self.mod_a.sort_order, 0)
        self.assertEqual(self.mod_b.sort_order, 1)
        new_mod = CourseModule.objects.get(
            course=self.course,
            youtube_video_id='vidC',
        )
        self.assertEqual(new_mod.sort_order, 2)
        self.assertTrue(
            LessonProgress.objects.filter(
                user=self.user,
                module=self.mod_a,
                completed=True,
            ).exists()
        )

    @patch('courses.services.playlist_sync.fetch_playlist_videos')
    def test_sync_hides_removed_videos(self, fetch):
        fetch.return_value = [
            {
                'youtube_video_id': 'vidA',
                'title': 'Lesson A',
                'thumbnail_url': '',
                'video_url': 'https://www.youtube.com/watch?v=vidA',
                'position': 0,
            },
        ]
        sync_course_playlist(self.course, 'test-api-key')
        self.mod_b.refresh_from_db()
        self.assertFalse(self.mod_b.is_available)

    @override_settings(YOUTUBE_API_KEY='')
    def test_sync_command_without_api_key(self):
        out = StringIO()
        call_command('sync_playlists', stdout=out)
        self.assertIn('YOUTUBE_API_KEY', out.getvalue())
        self.assertEqual(
            CourseModule.objects.filter(course=self.course).count(),
            2,
        )
