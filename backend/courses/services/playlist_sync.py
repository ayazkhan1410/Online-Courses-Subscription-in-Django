"""Sync published course playlists from the YouTube Data API."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.db import transaction
from django.utils.html import escape

from courses.models import CourseModule, Courses
from courses.services.playlist_import import strip_emoji

logger = logging.getLogger(__name__)

YOUTUBE_PLAYLIST_ITEMS_URL = (
    'https://www.googleapis.com/youtube/v3/playlistItems'
)


class PlaylistSyncError(Exception):
    """YouTube API playlist fetch failed."""


def fetch_playlist_videos(
    playlist_id: str,
    api_key: str,
) -> list[dict[str, Any]]:
    """Return playlist videos in API order."""
    if not api_key:
        return []
    items: list[dict[str, Any]] = []
    page_token = ''
    while True:
        query = urllib.parse.urlencode(
            {
                'part': 'snippet,contentDetails',
                'playlistId': playlist_id,
                'maxResults': 50,
                'key': api_key,
                'pageToken': page_token,
            }
        )
        url = f'{YOUTUBE_PLAYLIST_ITEMS_URL}?{query}'
        request = urllib.request.Request(url, method='GET')
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='replace')
            raise PlaylistSyncError(
                f'YouTube API error {exc.code}: {body[:200]}'
            ) from exc
        except urllib.error.URLError as exc:
            raise PlaylistSyncError(f'YouTube API unreachable: {exc}') from exc
        for row in payload.get('items') or []:
            snippet = row.get('snippet') or {}
            details = row.get('contentDetails') or {}
            video_id = (details.get('videoId') or '').strip()
            if not video_id:
                continue
            thumbs = snippet.get('thumbnails') or {}
            thumb_url = ''
            for key in ('maxres', 'high', 'medium', 'default'):
                if key in thumbs and thumbs[key].get('url'):
                    thumb_url = thumbs[key]['url']
                    break
            title = strip_emoji(snippet.get('title') or video_id)[:255]
            items.append(
                {
                    'youtube_video_id': video_id[:32],
                    'title': title,
                    'thumbnail_url': thumb_url[:500],
                    'video_url': (
                        f'https://www.youtube.com/watch?v={video_id}'
                    )[:500],
                    'position': int(snippet.get('position') or len(items)),
                }
            )
        page_token = (payload.get('nextPageToken') or '').strip()
        if not page_token:
            break
    return items


def sync_course_playlist(
    course: Courses,
    api_key: str,
) -> dict[str, int]:
    """Append new lessons and hide removed ones; keep lesson order."""
    playlist_id = (course.youtube_playlist_id or '').strip()
    if not playlist_id:
        return {
            'added': 0,
            'hidden': 0,
            'restored': 0,
            'updated': 0,
            'skipped': 1,
        }
    remote = fetch_playlist_videos(playlist_id, api_key)
    remote_ids = {row['youtube_video_id'] for row in remote}
    stats = {
        'added': 0,
        'hidden': 0,
        'restored': 0,
        'updated': 0,
        'skipped': 0,
    }
    with transaction.atomic():
        modules = list(
            CourseModule.objects.filter(course=course).select_for_update()
        )
        by_video = {
            (m.youtube_video_id or '').strip(): m
            for m in modules
            if (m.youtube_video_id or '').strip()
        }
        max_order = max((m.sort_order for m in modules), default=-1)
        for row in remote:
            video_id = row['youtube_video_id']
            title = row['title']
            module = by_video.get(video_id)
            if module is None:
                max_order += 1
                CourseModule.objects.create(
                    course=course,
                    module_name=title,
                    module_description=f'<p>{escape(title[:300])}</p>',
                    module_video=row['video_url'],
                    youtube_video_id=video_id,
                    thumbnail_url=row.get('thumbnail_url') or '',
                    sort_order=max_order,
                    is_available=True,
                )
                stats['added'] += 1
                continue
            changed: list[str] = []
            if not module.is_available:
                module.is_available = True
                changed.append('is_available')
                stats['restored'] += 1
            if module.module_name != title:
                module.module_name = title
                changed.append('module_name')
            thumb = row.get('thumbnail_url') or ''
            if thumb and module.thumbnail_url != thumb:
                module.thumbnail_url = thumb
                changed.append('thumbnail_url')
            if changed:
                module.save(update_fields=changed)
                if any(f != 'is_available' for f in changed):
                    stats['updated'] += 1
        for module in modules:
            vid = (module.youtube_video_id or '').strip()
            if not vid or vid in remote_ids:
                continue
            if module.is_available:
                module.is_available = False
                module.save(update_fields=['is_available'])
                stats['hidden'] += 1
    return stats


def sync_published_playlists(api_key: str | None) -> dict[str, int]:
    """Sync every published course that has a YouTube playlist id."""
    if not (api_key or '').strip():
        logger.warning('YOUTUBE_API_KEY is not set; skipping playlist sync.')
        return {
            'courses': 0,
            'added': 0,
            'hidden': 0,
            'restored': 0,
            'updated': 0,
            'skipped_all': 1,
        }
    totals = {
        'courses': 0,
        'added': 0,
        'hidden': 0,
        'restored': 0,
        'updated': 0,
        'skipped_all': 0,
    }
    qs = (
        Courses.objects.filter(status=Courses.STATUS_PUBLISHED)
        .exclude(youtube_playlist_id__isnull=True)
        .exclude(youtube_playlist_id='')
        .order_by('id')
    )
    for course in qs:
        try:
            stats = sync_course_playlist(course, api_key.strip())
        except PlaylistSyncError as exc:
            logger.error(
                'Playlist sync failed for %s (%s): %s',
                course.slug,
                course.youtube_playlist_id,
                exc,
            )
            continue
        totals['courses'] += 1
        for key in ('added', 'hidden', 'restored', 'updated'):
            totals[key] += stats.get(key, 0)
        logger.info(
            'Synced %s: added=%s hidden=%s restored=%s updated=%s',
            course.slug,
            stats.get('added', 0),
            stats.get('hidden', 0),
            stats.get('restored', 0),
            stats.get('updated', 0),
        )
    return totals
