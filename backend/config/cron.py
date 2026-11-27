"""HTTPS cron endpoints for Render free (no native cron)."""

from __future__ import annotations

import hmac
import logging

from django.conf import settings
from django.http import HttpResponseNotFound, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from accounts.utils.weekly_reminder import (
    iter_reminder_candidates,
    send_weekly_reminder,
)
from courses.services.playlist_sync import sync_published_playlists

logger = logging.getLogger(__name__)

_JOBS = frozenset({'sync_playlists', 'send_weekly_reminders'})


def _secret_ok(request) -> bool:
    expected = (getattr(settings, 'CRON_SECRET', '') or '').encode('utf-8')
    provided = (request.headers.get('X-Cron-Secret') or '').encode('utf-8')
    if not expected or not provided:
        return False
    return hmac.compare_digest(expected, provided)


@csrf_exempt
@require_POST
def cron_job(request, job: str):
    if job not in _JOBS or not _secret_ok(request):
        return HttpResponseNotFound('Not found')

    if job == 'sync_playlists':
        api_key = getattr(settings, 'YOUTUBE_API_KEY', '')
        totals = sync_published_playlists(api_key)
        logger.info('Cron sync_playlists finished | %s', totals)
        return JsonResponse({'job': job, 'ok': True, **totals})

    sent = 0
    skipped = 0
    for user in iter_reminder_candidates():
        if send_weekly_reminder(user):
            sent += 1
        else:
            skipped += 1
    summary = {'job': job, 'ok': True, 'sent': sent, 'skipped': skipped}
    logger.info('Cron send_weekly_reminders finished | %s', summary)
    return JsonResponse(summary)
