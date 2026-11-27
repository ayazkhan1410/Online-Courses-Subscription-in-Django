from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import (
    Category,
    CourseModule,
    Courses,
    LearningPath,
    PathStep,
    Project,
)
from courses.services.playlist_import import playlist_id_from_url, resolve_import_status
from learning.models import Enrollment


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
        self.user.email_verified = True
        self.user.save(update_fields=['email_verified'])
        self.token = Token.objects.create(user=self.user)
        self.free = Courses.objects.create(
            courses_name='Free Course',
            courses_description='Free',
            is_premium=False,
            youtube_playlist_id='free-pl',
            slug='free-course',
            status=Courses.STATUS_PUBLISHED,
        )
        self.premium = Courses.objects.create(
            courses_name='Premium Course',
            courses_description='Pro',
            is_premium=True,
            youtube_playlist_id='pro-pl',
            slug='premium-course',
            status=Courses.STATUS_PUBLISHED,
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
        self.assertIn('youtube-nocookie.com/embed/free123', module['embed_url'])

    def test_logged_in_user_can_enroll_any_course(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.post('/api/courses/premium-course/enroll/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Enrollment.objects.filter(user=self.user, course=self.premium).exists()
        )

    def test_enrolled_modules_unlocked_without_pro(self):
        Enrollment.objects.create(user=self.user, course=self.premium)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/courses/premium-course/')
        module = response.data['course_modules'][0]
        self.assertFalse(module['is_locked'])
        self.assertEqual(module['youtube_video_id'], 'pro123')
        self.assertIn('youtube-nocookie.com/embed/pro123', module['embed_url'])

    def test_unpublished_course_hidden_from_public(self):
        Courses.objects.create(
            courses_name='Draft',
            courses_description='hidden',
            youtube_playlist_id='draft-pl',
            slug='draft-course',
            status=Courses.STATUS_PENDING,
        )
        listing = self.client.get('/api/courses/')
        slugs = [row['slug'] for row in listing.data['results']]
        self.assertIn('free-course', slugs)
        self.assertNotIn('draft-course', slugs)
        detail = self.client.get('/api/courses/draft-course/')
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_category_counts_published_courses_only(self):
        category = Category.objects.create(
            name='Python',
            slug='python',
            icon='code-2',
            sort_order=1,
        )
        self.free.category = category
        self.free.save(update_fields=['category'])
        Courses.objects.create(
            courses_name='Pending Python',
            youtube_playlist_id='pending-py',
            slug='pending-python',
            category=category,
            status=Courses.STATUS_PENDING,
        )
        self.free.thumbnail_url = 'https://img.example/python-cover.jpg'
        self.free.save(update_fields=['thumbnail_url'])
        response = self.client.get('/api/categories/')
        row = next(item for item in response.data if item['slug'] == 'python')
        self.assertEqual(row['published_course_count'], 1)
        self.assertEqual(row['cover_image_url'], 'https://img.example/python-cover.jpg')
        detail = self.client.get('/api/categories/python/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data['category']['slug'], 'python')
        self.assertEqual(
            detail.data['category']['cover_image_url'],
            'https://img.example/python-cover.jpg',
        )
        self.assertEqual(
            [course['slug'] for course in detail.data['results']],
            ['free-course'],
        )

    def test_playlist_id_and_publish_rules(self):
        playlist_url = (
            'https://www.youtube.com/playlist?list=PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p'
        )
        self.assertEqual(
            playlist_id_from_url(playlist_url),
            'PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p',
        )
        self.assertEqual(
            resolve_import_status(
                publish=False,
                category_slug='study-with-ayaz',
                is_owner=False,
                created=True,
                current=Courses.STATUS_PENDING,
            ),
            Courses.STATUS_PUBLISHED,
        )
        self.assertEqual(
            resolve_import_status(
                publish=False,
                category_slug='python',
                is_owner=False,
                created=False,
                current=Courses.STATUS_PUBLISHED,
            ),
            Courses.STATUS_PUBLISHED,
        )

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


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework.authentication.TokenAuthentication',
        ],
        'DEFAULT_THROTTLE_CLASSES': [],
        'PAGE_SIZE': 8,
    }
)
class PathsAndProjectsAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.published = Courses.objects.create(
            courses_name='Path Course A',
            courses_description='A',
            youtube_playlist_id='path-pl-a',
            slug='path-course-a',
            status=Courses.STATUS_PUBLISHED,
            thumbnail_url='https://img.example/a.jpg',
        )
        self.hidden = Courses.objects.create(
            courses_name='Path Course Hidden',
            youtube_playlist_id='path-pl-hidden',
            slug='path-course-hidden',
            status=Courses.STATUS_HIDDEN,
        )
        self.path_pub = LearningPath.objects.create(
            title='Published path',
            slug='published-path',
            summary='Summary',
            level='Beginner',
            sort_order=1,
            is_published=True,
        )
        PathStep.objects.create(
            path=self.path_pub,
            course=self.published,
            sort_order=1,
            note='Start here.',
        )
        self.path_draft = LearningPath.objects.create(
            title='Draft path',
            slug='draft-path',
            summary='Hidden',
            level='Beginner',
            is_published=False,
        )
        PathStep.objects.create(
            path=self.path_draft,
            course=self.published,
            sort_order=1,
        )

    def test_paths_list_only_published_with_ordered_steps(self):
        response = self.client.get('/api/paths/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        row = response.data[0]
        self.assertEqual(row['slug'], 'published-path')
        self.assertEqual(row['step_count'], 1)
        self.assertEqual(row['steps'][0]['sort_order'], 1)
        self.assertEqual(row['steps'][0]['course']['slug'], 'path-course-a')
        self.assertEqual(row['steps'][0]['course']['title'], 'Path Course A')

    def test_path_detail_includes_course_card_fields(self):
        response = self.client.get('/api/paths/published-path/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        course = response.data['steps'][0]['course']
        self.assertIn('module_count', course)
        self.assertEqual(course['slug'], 'path-course-a')

    def test_projects_empty_when_none_published(self):
        Project.objects.create(
            title='Draft project',
            slug='draft-project',
            summary='Not live',
            tech='Django',
            is_published=False,
        )
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_config_includes_about_facts(self):
        Category.objects.create(name='Python', slug='python-cfg')
        response = self.client.get('/api/config/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('fiverr_profile_url', response.data)
        self.assertIn('published_course_count', response.data)
        self.assertIn('category_count', response.data)
