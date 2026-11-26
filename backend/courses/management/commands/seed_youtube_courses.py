"""Idempotent seed from courses/data/youtube_catalog.json."""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils.html import escape
from django.utils.text import slugify

from courses.models import CourseModule, Courses
from learning.models import Enrollment

logger = logging.getLogger(__name__)

CATALOG_PATH = Path(__file__).resolve().parents[2] / 'data' / 'youtube_catalog.json'

# Mark a few skill-heavy playlists as premium for the Pro flow.
PREMIUM_PLAYLIST_IDS = {
    'PLqG7o8rLExOpOw8PH-w9x7A-chWaCueu4',  # 50 Days of Python
    'PLqG7o8rLExOp5BhKgq4E11g1-ODZD4-zf',  # Python Complete course
    'PLqG7o8rLExOrVUD2Ua8AcaCOth1bTx7Fa',  # Java course
    'PLqG7o8rLExOrfSmz2RY4p95asOaB2cytd',  # YouTube SEO
}


EMOJI_RE = re.compile(
    '[\U0001f300-\U0001faff\U00002600-\U000027bf\U0000fe0f\U0000200d]'
)


def _strip_emoji(value: str) -> str:
    return EMOJI_RE.sub('', value or '').strip()


def _description_html(text: str) -> str:
    text = _strip_emoji(text or '').strip()
    if not text:
        return '<p>Course lessons from the Study with Ayaz YouTube playlist.</p>'
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [text[:800]]
    return ''.join(f'<p>{escape(p)}</p>' for p in paragraphs[:6])


class Command(BaseCommand):
    help = (
        'Seed courses and modules from youtube_catalog.json '
        '(safe to re-run; updates in place, no duplicates).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            type=str,
            default=str(CATALOG_PATH),
            help='Path to youtube_catalog.json',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options['path'])
        if not path.exists():
            self.stderr.write(self.style.ERROR(f'Catalog not found: {path}'))
            return

        catalog = json.loads(path.read_text(encoding='utf-8'))
        courses_data = catalog.get('courses') or []
        created_courses = 0
        updated_courses = 0
        created_modules = 0
        updated_modules = 0

        # Drop legacy placeholder courses that are not tied to YouTube,
        # but never remove courses that already have enrollments.
        enrolled_course_ids = Enrollment.objects.values_list('course_id', flat=True)
        Courses.objects.filter(
            Q(youtube_playlist_id__isnull=True) | Q(youtube_playlist_id='')
        ).exclude(id__in=enrolled_course_ids).delete()

        for item in courses_data:
            playlist_id = item.get('youtube_playlist_id') or ''
            title = _strip_emoji(item.get('title') or '').strip()
            if not playlist_id or not title:
                continue

            defaults = {
                'courses_name': title[:255],
                'courses_description': _description_html(item.get('description') or ''),
                'thumbnail_url': (item.get('thumbnail_url') or '')[:500],
                'playlist_url': (item.get('playlist_url') or '')[:500],
                'is_premium': playlist_id in PREMIUM_PLAYLIST_IDS,
            }
            course, was_created = Courses.objects.update_or_create(
                youtube_playlist_id=playlist_id,
                defaults=defaults,
            )
            if was_created:
                # Ensure slug from title on create if blank
                if not course.slug:
                    course.slug = slugify(title)[:200] or playlist_id[:32]
                    course.save(update_fields=['slug'])
                created_courses += 1
            else:
                updated_courses += 1

            seen_video_ids: set[str] = set()
            for mod in item.get('modules') or []:
                video_id = (mod.get('youtube_video_id') or '').strip()
                if not video_id or video_id in seen_video_ids:
                    continue
                seen_video_ids.add(video_id)
                video_url = (
                    mod.get('video_url')
                    or f'https://www.youtube.com/watch?v={video_id}'
                )
                mod_defaults = {
                    'module_name': _strip_emoji(mod.get('title') or video_id)[:255],
                    'module_description': (
                        f'<p>{escape((mod.get("title") or "")[:300])}</p>'
                    ),
                    'module_video': video_url[:500],
                    'thumbnail_url': (mod.get('thumbnail_url') or '')[:500],
                    'sort_order': int(mod.get('sort_order') or 0),
                    'can_view': True,
                }
                module, mod_created = CourseModule.objects.update_or_create(
                    course=course,
                    youtube_video_id=video_id,
                    defaults=mod_defaults,
                )
                if mod_created:
                    created_modules += 1
                else:
                    updated_modules += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Seed complete: '
                f'courses +{created_courses}/~{updated_courses}, '
                f'modules +{created_modules}/~{updated_modules}'
            )
        )
