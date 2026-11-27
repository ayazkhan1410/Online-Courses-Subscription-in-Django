from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Courses, PlaylistSuggestion
from courses.views_suggest import PlaylistSuggestionCreateAPIView


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': [],
        'DEFAULT_THROTTLE_CLASSES': [
            'rest_framework.throttling.ScopedRateThrottle',
        ],
        'DEFAULT_THROTTLE_RATES': {'playlist_suggest': '5/min'},
    }
)
class PlaylistSuggestionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.url = '/api/playlist-suggestions/'
        self.payload = {
            'url': 'https://www.youtube.com/playlist?list=PLsuggest01',
            'note': 'Great beginner Python series.',
            'email': 'suggester@example.com',
        }

    def test_throttle_scope(self):
        self.assertEqual(
            PlaylistSuggestionCreateAPIView.throttle_scope,
            'playlist_suggest',
        )

    def test_rejects_invalid_playlist_url(self):
        bad = {**self.payload, 'url': 'https://www.youtube.com/watch?v=abc'}
        response = self.client.post(self.url, bad, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)

    def test_rejects_duplicate_catalog_playlist(self):
        Courses.objects.create(
            courses_name='Already here',
            courses_description='',
            youtube_playlist_id='PLsuggest01',
            slug='already-here',
            status=Courses.STATUS_PUBLISHED,
        )
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)
        err = response.data['url']
        if isinstance(err, dict):
            self.assertEqual(err.get('course_slug'), 'already-here')
            self.assertIn('/courses/already-here', err.get('course_url', ''))

    def test_create_suggestion(self):
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlaylistSuggestion.objects.count(), 1)
