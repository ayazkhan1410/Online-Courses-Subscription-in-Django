from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import CustomUser
from courses.models import CourseModule, Courses, Creator
from learning.models import Completion, Enrollment


@override_settings(
    FRONTEND_URL='http://localhost:4780',
    API_PUBLIC_URL='http://localhost:4781',
)
class SeoMetaTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.api = APIClient()
        self.creator = Creator.objects.create(
            name='Ayaz Ahmed',
            slug='ayaz-ahmed',
        )
        self.course = Courses.objects.create(
            courses_name='SEO Python',
            courses_description='<p>Learn SEO basics with Python.</p>',
            slug='seo-python',
            status=Courses.STATUS_PUBLISHED,
            creator=self.creator,
            youtube_playlist_id='seo-pl',
        )
        CourseModule.objects.create(
            course=self.course,
            module_name='Day 1',
            module_video='https://www.youtube.com/watch?v=seo1',
            youtube_video_id='seo1',
            sort_order=1,
        )

    def test_course_html_has_meta_and_json_ld(self):
        response = self.client.get('/courses/seo-python/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.content.decode()
        self.assertIn('SEO Python — Study with Ayaz', body)
        self.assertIn('property="og:title"', body)
        self.assertIn('property="og:image"', body)
        self.assertIn('application/ld+json', body)
        self.assertIn('"@type": "Course"', body)
        self.assertIn('Ayaz Ahmed', body)
        self.assertIn('Study with Ayaz', body)

    def test_robots_txt(self):
        response = self.client.get('/robots.txt')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        text = response.content.decode()
        self.assertIn('Disallow: /dashboard', text)
        self.assertIn('Disallow: /learn', text)
        self.assertIn('Disallow: /api', text)
        self.assertIn('Sitemap: http://localhost:4780/sitemap.xml', text)

    def test_sitemap_lists_published_course(self):
        from seo.sitemaps import CourseSitemap, StaticViewSitemap

        course_locs = [
            CourseSitemap().location(row)
            for row in CourseSitemap().items()
        ]
        self.assertIn('/courses/seo-python', course_locs)
        static_keys = StaticViewSitemap().items()
        static = [StaticViewSitemap().location(k) for k in static_keys]
        self.assertIn('/', static)
        self.assertIn('/about', static)

    def test_sitemap_xml_body(self):
        from django.contrib.sitemaps.views import sitemap as sitemap_view
        from django.test import RequestFactory

        from seo.urls import sitemap_config

        request = RequestFactory().get('/sitemap.xml')
        request.META['SERVER_NAME'] = 'localhost'
        request.META['SERVER_PORT'] = '4780'
        response = sitemap_view(request, sitemaps=sitemap_config)
        body = response.render().content.decode()
        self.assertIn('/courses/seo-python', body)
        self.assertIn('<urlset', body)

    def test_course_og_png(self):
        response = self.api.get('/api/og/course/seo-python.png')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'image/png')
        self.assertTrue(response.content.startswith(b'\x89PNG'))

    def test_default_og_png(self):
        response = self.api.get('/api/og/default.png')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.content.startswith(b'\x89PNG'))


@override_settings(
    FRONTEND_URL='http://localhost:4780',
    API_PUBLIC_URL='http://localhost:4781',
)
class DoneSeoMetaTests(TestCase):
    def setUp(self):
        cache.clear()
        user = CustomUser.objects.create_user(
            email='done@example.com',
            username='done',
            password='StrongPass123',
            full_name='Done User',
            user_choices='expert',
        )
        course = Courses.objects.create(
            courses_name='Done Course',
            courses_description='Done',
            slug='done-course',
            status=Courses.STATUS_PUBLISHED,
            youtube_playlist_id='done-pl',
        )
        mod_a = CourseModule.objects.create(
            course=course,
            module_name='A',
            module_video='https://www.youtube.com/watch?v=da',
            youtube_video_id='da',
            sort_order=1,
        )
        mod_b = CourseModule.objects.create(
            course=course,
            module_name='B',
            module_video='https://www.youtube.com/watch?v=db',
            youtube_video_id='db',
            sort_order=2,
        )
        Enrollment.objects.create(user=user, course=course)
        client = APIClient()
        client.force_authenticate(user=user)
        client.post(f'/api/modules/{mod_a.id}/progress/', {'completed': True})
        client.post(f'/api/modules/{mod_b.id}/progress/', {'completed': True})
        self.share_id = Completion.objects.get().share_id

    def test_done_html_has_og_image(self):
        response = APIClient().get(f'/done/{self.share_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.content.decode()
        self.assertIn(f'/api/og/done/{self.share_id}.png', body)
