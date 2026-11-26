"""YouTube playlist import and owner-catalog seeding."""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from django.db import transaction
from django.db.models import Q
from django.utils.html import escape
from django.utils.text import slugify

from courses.models import Category, CourseModule, Courses, Creator
from learning.models import Enrollment

logger = logging.getLogger(__name__)

OWNER_SLUG = 'study-with-ayaz'
OWNER_NAME = 'Study with Ayaz'
OWNER_CHANNEL_URL = 'https://www.youtube.com/@studywithayaz'

EMOJI_RE = re.compile(
    '[\U0001f300-\U0001faff\U00002600-\U000027bf\U0000fe0f\U0000200d]'
)

YOUTUBE_CATALOG_PATH = (
    Path(__file__).resolve().parents[1] / 'data' / 'youtube_catalog.json'
)


class PlaylistImportError(Exception):
    """Playlist URL or yt-dlp result cannot be stored."""


def strip_emoji(value: str) -> str:
    return EMOJI_RE.sub('', value or '').strip()


def description_html(text: str) -> str:
    text = strip_emoji(text or '').strip()
    if not text:
        return '<p>Course lessons from a YouTube playlist.</p>'
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [text[:800]]
    return ''.join(f'<p>{escape(p)}</p>' for p in paragraphs[:6])


def playlist_id_from_url(url: str) -> str:
    parsed = urlparse((url or '').strip())
    playlist_ids = parse_qs(parsed.query).get('list') or []
    playlist_id = (playlist_ids[0] if playlist_ids else '').strip()
    if not playlist_id:
        raise PlaylistImportError(f'No playlist id in URL: {url}')
    return playlist_id


def resolve_import_status(
    *,
    publish: bool,
    category_slug: str | None,
    is_owner: bool,
    created: bool,
    current: str,
) -> str:
    auto_publish = publish or category_slug == OWNER_SLUG or is_owner
    if auto_publish:
        return Courses.STATUS_PUBLISHED
    if created:
        return Courses.STATUS_PENDING
    return current


def ensure_owner_creator() -> Creator:
    creator, _created = Creator.objects.update_or_create(
        slug=OWNER_SLUG,
        defaults={
            'name': OWNER_NAME,
            'channel_url': OWNER_CHANNEL_URL,
            'is_owner': True,
        },
    )
    if not creator.is_owner:
        creator.is_owner = True
        creator.save(update_fields=['is_owner'])
    return creator


def _unique_slug(model, value: str) -> str:
    base = slugify(value)[:200] or 'creator'
    candidate = base
    n = 1
    while model.objects.filter(slug=candidate).exists():
        n += 1
        candidate = f'{base}-{n}'[:255]
    return candidate


def upsert_category(payload: dict) -> Category:
    slug = (payload.get('slug') or '').strip()
    if not slug:
        raise PlaylistImportError('Category slug is required')
    category, _created = Category.objects.update_or_create(
        slug=slug,
        defaults={
            'name': (payload.get('name') or slug)[:120],
            'description': payload.get('description') or '',
            'icon': (payload.get('icon') or '')[:64],
            'sort_order': int(payload.get('sort_order') or 0),
            'is_featured': bool(payload.get('is_featured', False)),
        },
    )
    return category


def _creator_from_info(info: dict) -> Creator:
    channel_id = (info.get('channel_id') or info.get('uploader_id') or '').strip()
    name = strip_emoji(info.get('channel') or info.get('uploader') or '')[:255]
    name = name or 'Unknown channel'
    channel_url = (info.get('channel_url') or info.get('uploader_url') or '')[:500]
    creator = None
    if channel_id:
        creator = Creator.objects.filter(youtube_channel_id=channel_id).first()
    if creator is None:
        creator = Creator.objects.filter(slug=slugify(name)[:255]).first()
    if creator is None:
        return Creator.objects.create(
            name=name,
            slug=_unique_slug(Creator, name),
            youtube_channel_id=channel_id or None,
            channel_url=channel_url,
            is_owner=False,
        )
    changed: list[str] = []
    if channel_url and not creator.channel_url:
        creator.channel_url = channel_url
        changed.append('channel_url')
    if channel_id and not creator.youtube_channel_id:
        creator.youtube_channel_id = channel_id
        changed.append('youtube_channel_id')
    if changed:
        creator.save(update_fields=changed)
    return creator


def _entry_video(entry: dict, index: int) -> dict | None:
    video_id = (entry.get('id') or '').strip()
    if not video_id or video_id.startswith('http'):
        return None
    title = strip_emoji(entry.get('title') or video_id)[:255]
    thumb = (entry.get('thumbnail') or '')[:500]
    if not thumb:
        thumbs = entry.get('thumbnails') or []
        if thumbs:
            thumb = (thumbs[-1].get('url') or '')[:500]
    raw_url = (entry.get('url') or '').strip()
    if not raw_url.startswith('http'):
        raw_url = f'https://www.youtube.com/watch?v={video_id}'
    duration = entry.get('duration')
    duration_seconds = int(duration) if isinstance(duration, (int, float)) else None
    return {
        'youtube_video_id': video_id[:32],
        'title': title,
        'thumbnail_url': thumb,
        'video_url': raw_url[:500],
        'sort_order': index,
        'duration_seconds': duration_seconds,
    }


def _sync_modules(course: Courses, modules: list[dict]) -> tuple[int, int]:
    created = 0
    updated = 0
    seen: set[str] = set()
    for mod in modules:
        video_id = (mod.get('youtube_video_id') or '').strip()
        if not video_id or video_id in seen:
            continue
        seen.add(video_id)
        title = strip_emoji(mod.get('title') or video_id)[:255]
        _module, was_created = CourseModule.objects.update_or_create(
            course=course,
            youtube_video_id=video_id,
            defaults={
                'module_name': title,
                'module_description': f'<p>{escape(title[:300])}</p>',
                'module_video': (mod.get('video_url') or '')[:500],
                'thumbnail_url': (mod.get('thumbnail_url') or '')[:500],
                'sort_order': int(mod.get('sort_order') or 0),
                'duration_seconds': mod.get('duration_seconds'),
                'can_view': True,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    # shortcut: videos dropped from the playlist stay on the course, prune if editors need a full sync
    return created, updated


def upsert_youtube_course(
    *,
    playlist_id: str,
    title: str,
    description: str,
    thumbnail_url: str,
    playlist_url: str,
    category: Category | None,
    creator: Creator | None,
    level: str,
    language: str,
    modules: list[dict],
    publish: bool,
    sort_order: int = 0,
) -> tuple[Courses, bool, int, int]:
    clean_title = strip_emoji(title)[:255]
    if not playlist_id or not clean_title:
        raise PlaylistImportError('Playlist id and title are required')
    level = level if level in dict(Courses.LEVEL_CHOICES) else Courses.LEVEL_BEGINNER
    language = (
        language if language in dict(Courses.LANGUAGE_CHOICES) else Courses.LANGUAGE_EN
    )
    with transaction.atomic():
        course, created = Courses.objects.update_or_create(
            youtube_playlist_id=playlist_id,
            defaults={
                'courses_name': clean_title,
                'courses_description': description_html(description),
                'thumbnail_url': (thumbnail_url or '')[:500],
                'playlist_url': (playlist_url or '')[:500],
                'is_premium': False,
                'category': category,
                'creator': creator,
                'level': level,
                'language': language,
                'sort_order': sort_order,
            },
        )
        course.status = resolve_import_status(
            publish=publish,
            category_slug=category.slug if category else None,
            is_owner=bool(creator and creator.is_owner),
            created=created,
            current=course.status,
        )
        course.save(update_fields=['status'])
        mod_created, mod_updated = _sync_modules(course, modules)
    return course, created, mod_created, mod_updated


def fetch_playlist(url: str) -> dict:
    try:
        import yt_dlp
    except ImportError as exc:
        raise PlaylistImportError('yt-dlp is not installed') from exc

    options = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': 'in_playlist',
        'ignoreerrors': True,
    }
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:
        logger.error('yt-dlp failed for %s: %s', url, exc)
        raise PlaylistImportError(f'Could not read playlist: {exc}') from exc
    if not info:
        raise PlaylistImportError(f'Empty response for {url}')
    return info


def import_playlist(
    playlist_url: str,
    *,
    category: Category | None = None,
    level: str = Courses.LEVEL_BEGINNER,
    language: str = Courses.LANGUAGE_EN,
    publish: bool = False,
    sort_order: int = 0,
) -> Courses:
    info = fetch_playlist(playlist_url)
    entries = [entry for entry in (info.get('entries') or []) if entry]
    playlist_id = (info.get('id') or '').strip() or playlist_id_from_url(playlist_url)
    if info.get('_type') not in (None, 'playlist') and not entries:
        raise PlaylistImportError('URL is not a YouTube playlist')
    if category and category.slug == OWNER_SLUG:
        creator = ensure_owner_creator()
    else:
        creator = _creator_from_info(info)
    modules = []
    for index, entry in enumerate(entries):
        video = _entry_video(entry, index)
        if video:
            modules.append(video)
    thumb = (info.get('thumbnail') or '')[:500]
    course, _created, _mc, _mu = upsert_youtube_course(
        playlist_id=playlist_id,
        title=info.get('title') or playlist_id,
        description=info.get('description') or '',
        thumbnail_url=thumb,
        playlist_url=(info.get('webpage_url') or playlist_url)[:500],
        category=category,
        creator=creator,
        level=level,
        language=language,
        modules=modules,
        publish=publish,
        sort_order=sort_order,
    )
    logger.info('Imported playlist %s as course %s', playlist_id, course.pk)
    return course


def seed_owner_from_catalog(
    category: Category,
    catalog_path: Path,
    playlist_meta: dict[str, dict] | None = None,
) -> dict[str, int]:
    """Load Study with Ayaz courses from the cached youtube_catalog.json."""
    if not catalog_path.exists():
        raise PlaylistImportError(f'Catalog not found: {catalog_path}')
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    creator = ensure_owner_creator()
    meta = playlist_meta or {}
    enrolled_ids = Enrollment.objects.values_list('course_id', flat=True)
    Courses.objects.filter(
        Q(youtube_playlist_id__isnull=True) | Q(youtube_playlist_id='')
    ).exclude(id__in=enrolled_ids).delete()

    created_courses = 0
    updated_courses = 0
    created_modules = 0
    updated_modules = 0
    for index, item in enumerate(catalog.get('courses') or []):
        playlist_id = (item.get('youtube_playlist_id') or '').strip()
        title = item.get('title') or ''
        if not playlist_id or not strip_emoji(title):
            continue
        extra = meta.get(playlist_id) or {}
        course, was_created, mod_c, mod_u = upsert_youtube_course(
            playlist_id=playlist_id,
            title=title,
            description=item.get('description') or '',
            thumbnail_url=item.get('thumbnail_url') or '',
            playlist_url=item.get('playlist_url')
            or f'https://www.youtube.com/playlist?list={playlist_id}',
            category=category,
            creator=creator,
            level=extra.get('level') or Courses.LEVEL_BEGINNER,
            language=extra.get('language') or Courses.LANGUAGE_EN,
            modules=[
                {
                    'youtube_video_id': mod.get('youtube_video_id'),
                    'title': mod.get('title'),
                    'thumbnail_url': mod.get('thumbnail_url'),
                    'video_url': mod.get('video_url')
                    or (
                        f'https://www.youtube.com/watch?v={mod.get("youtube_video_id")}'
                    ),
                    'sort_order': mod.get('sort_order') or 0,
                    'duration_seconds': mod.get('duration_seconds'),
                }
                for mod in (item.get('modules') or [])
            ],
            publish=True,
            sort_order=int(extra.get('sort_order', index)),
        )
        if was_created:
            created_courses += 1
        else:
            updated_courses += 1
        created_modules += mod_c
        updated_modules += mod_u
        logger.info('Seeded owner course %s', course.youtube_playlist_id)
    return {
        'created_courses': created_courses,
        'updated_courses': updated_courses,
        'created_modules': created_modules,
        'updated_modules': updated_modules,
    }
