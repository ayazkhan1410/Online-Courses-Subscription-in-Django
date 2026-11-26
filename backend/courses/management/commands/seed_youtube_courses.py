"""Seed Study with Ayaz courses. Thin wrapper around seed_catalog."""

from __future__ import annotations

from django.core.management import call_command
from django.core.management.base import BaseCommand

from courses.services.playlist_import import OWNER_SLUG, YOUTUBE_CATALOG_PATH


class Command(BaseCommand):
    help = 'Seed owner courses from youtube_catalog.json via seed_catalog.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            type=str,
            default=str(YOUTUBE_CATALOG_PATH),
            help='Path to youtube_catalog.json',
        )

    def handle(self, *args, **options):
        call_command(
            'seed_catalog',
            only=OWNER_SLUG,
            catalog=options['path'],
            skip_network=True,
        )
