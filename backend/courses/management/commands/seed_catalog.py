"""Seed categories and playlists from courses/data/catalog."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from django.core.management.base import BaseCommand

from courses.models import Courses
from courses.services.playlist_import import (
    OWNER_SLUG,
    YOUTUBE_CATALOG_PATH,
    PlaylistImportError,
    import_playlist,
    playlist_id_from_url,
    seed_owner_from_catalog,
    upsert_category,
)

logger = logging.getLogger(__name__)

CATALOG_DIR = Path(__file__).resolve().parents[2] / 'data' / 'catalog'


class Command(BaseCommand):
    help = (
        'Ensure catalog categories and import their playlists. '
        'Study with Ayaz is loaded from youtube_catalog.json (no network).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--only',
            type=str,
            default='',
            help='Seed a single category slug.',
        )
        parser.add_argument(
            '--catalog',
            type=str,
            default=str(YOUTUBE_CATALOG_PATH),
            help='Path to youtube_catalog.json for the owner category.',
        )
        parser.add_argument(
            '--refresh',
            action='store_true',
            help='Re-fetch third-party playlists that are already stored.',
        )
        parser.add_argument(
            '--skip-network',
            action='store_true',
            help='Do not call yt-dlp. Owner cache is still applied.',
        )

    def handle(self, *args, **options):
        only = (options['only'] or '').strip()
        files = sorted(CATALOG_DIR.glob('*.json'))
        if not files:
            self.stderr.write(self.style.ERROR(f'No catalog JSON in {CATALOG_DIR}'))
            return

        for path in files:
            payload = json.loads(path.read_text(encoding='utf-8'))
            category_payload = payload.get('category') or {}
            slug = (category_payload.get('slug') or '').strip()
            if only and slug != only:
                continue
            category = upsert_category(category_payload)
            if slug == OWNER_SLUG:
                self._seed_owner(category, payload, Path(options['catalog']))
            else:
                self._seed_third_party(
                    category,
                    payload.get('playlists') or [],
                    refresh=options['refresh'],
                    skip_network=options['skip_network'],
                )
        self.stdout.write(self.style.SUCCESS('Catalog seed finished.'))

    def _seed_owner(self, category, payload: dict, catalog_path: Path) -> None:
        meta: dict[str, dict] = {}
        for index, item in enumerate(payload.get('playlists') or []):
            try:
                playlist_id = playlist_id_from_url(item.get('url') or '')
            except PlaylistImportError:
                continue
            meta[playlist_id] = {
                'level': item.get('level') or Courses.LEVEL_BEGINNER,
                'language': item.get('language') or Courses.LANGUAGE_EN,
                'sort_order': index,
            }
        try:
            stats = seed_owner_from_catalog(category, catalog_path, meta)
        except PlaylistImportError as exc:
            self.stderr.write(self.style.ERROR(str(exc)))
            return
        self.stdout.write(
            'Owner catalog: '
            f'courses +{stats["created_courses"]}/~{stats["updated_courses"]}, '
            f'modules +{stats["created_modules"]}/~{stats["updated_modules"]}'
        )

    def _seed_third_party(
        self,
        category,
        playlists: list,
        *,
        refresh: bool,
        skip_network: bool,
    ) -> None:
        for index, item in enumerate(playlists):
            url = (item.get('url') or '').strip()
            level = item.get('level') or Courses.LEVEL_BEGINNER
            language = item.get('language') or Courses.LANGUAGE_EN
            try:
                playlist_id = playlist_id_from_url(url)
            except PlaylistImportError as exc:
                logger.error('Skip %s: %s', url, exc)
                self.stderr.write(self.style.WARNING(str(exc)))
                continue
            existing = Courses.objects.filter(youtube_playlist_id=playlist_id).first()
            if existing is not None and not refresh:
                existing.category = category
                existing.level = level
                existing.language = language
                existing.sort_order = index
                if existing.status != Courses.STATUS_HIDDEN:
                    existing.status = Courses.STATUS_PUBLISHED
                existing.save(
                    update_fields=[
                        'category',
                        'level',
                        'language',
                        'sort_order',
                        'status',
                    ]
                )
                continue
            if skip_network:
                self.stdout.write(f'Skip network import {playlist_id}')
                continue
            try:
                course = import_playlist(
                    url,
                    category=category,
                    level=level,
                    language=language,
                    publish=True,
                    sort_order=index,
                )
            except PlaylistImportError as exc:
                logger.error('Import failed for %s: %s', url, exc)
                self.stderr.write(self.style.WARNING(f'{url}: {exc}'))
                continue
            self.stdout.write(
                f'{category.slug}: {course.courses_name} ({course.status})'
            )
