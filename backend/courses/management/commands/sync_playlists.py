from django.conf import settings
from django.core.management.base import BaseCommand

from courses.services.playlist_sync import sync_published_playlists


class Command(BaseCommand):
    help = 'Re-fetch published YouTube playlists and merge new lessons.'

    def handle(self, *args, **options):
        api_key = getattr(settings, 'YOUTUBE_API_KEY', '')
        totals = sync_published_playlists(api_key)
        if totals.get('skipped_all'):
            self.stdout.write(
                self.style.WARNING(
                    'YOUTUBE_API_KEY is not set; nothing to sync.'
                )
            )
            return
        self.stdout.write(
            self.style.SUCCESS(
                'Synced %(courses)s course(s): '
                '%(added)s added, %(hidden)s hidden, '
                '%(restored)s restored, %(updated)s updated.'
                % totals
            )
        )