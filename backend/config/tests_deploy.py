from django.test import Client, TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Courses, Creator


@override_settings(CRON_SECRET='test-cron-secret')
class DeployPlumbingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.api = APIClient()
        self.creator = Creator.objects.create(name='Ayaz', slug='ayaz-deploy')
        self.course = Courses.objects.create(
            courses_name='Deploy Python',
            courses_description='Deploy course',
            slug='deploy-python',
            status=Courses.STATUS_PUBLISHED,
            creator=self.creator,
            youtube_playlist_id='deploy-pl',
        )

    def test_healthz_ok_without_auth(self):
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.content.decode(), 'ok')

    def test_cron_rejects_missing_or_bad_secret(self):
        missing = self.client.post('/api/internal/cron/sync_playlists/')
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)
        bad = self.client.post(
            '/api/internal/cron/sync_playlists/',
            HTTP_X_CRON_SECRET='wrong',
        )
        self.assertEqual(bad.status_code, status.HTTP_404_NOT_FOUND)

    def test_cron_sync_playlists_with_secret(self):
        response = self.client.post(
            '/api/internal/cron/sync_playlists/',
            HTTP_X_CRON_SECRET='test-cron-secret',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body.get('ok'))
        self.assertEqual(body.get('job'), 'sync_playlists')

    def test_cron_weekly_reminders_with_secret(self):
        response = self.client.post(
            '/api/internal/cron/send_weekly_reminders/',
            HTTP_X_CRON_SECRET='test-cron-secret',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body.get('ok'))
        self.assertEqual(body.get('job'), 'send_weekly_reminders')
        self.assertIn('sent', body)

    def test_seo_head_known_and_unknown(self):
        ok = self.api.get('/api/seo/head/', {'path': '/courses/deploy-python'})
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        payload = ok.json()
        self.assertEqual(payload['status'], 200)
        self.assertIn('<title>', payload['head_html'])
        self.assertIn('Deploy Python', payload['head_html'])

        missing = self.api.get(
            '/api/seo/head/',
            {'path': '/courses/does-not-exist-xyz'},
        )
        self.assertEqual(missing.status_code, status.HTTP_200_OK)
        self.assertEqual(missing.json()['status'], 404)
