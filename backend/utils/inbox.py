"""Shared file inbox for local/e2e mail. Safe across gunicorn workers."""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)


def inbox_enabled() -> bool:
    # Vercel filesystem is read-only; never write the local mail inbox there.
    if getattr(settings, 'IS_VERCEL', False):
        return False
    if getattr(settings, 'EMAIL_INBOX_ENABLED', False):
        return True
    return bool(getattr(settings, 'DEBUG', False)) or bool(
        getattr(settings, 'TURNSTILE_TEST_MODE', False)
    )


def _inbox_dir() -> Path:
    configured = getattr(settings, 'EMAIL_INBOX_DIR', '') or ''
    if configured:
        path = Path(configured)
    else:
        path = Path(settings.MEDIA_ROOT) / '.mail_inbox'
    path.mkdir(parents=True, exist_ok=True)
    return path


def _safe_email(email: str) -> str:
    return re.sub(r'[^a-z0-9._+-]+', '_', email.lower())[:180]


def record_outbound_mail(
    recipients: list[str],
    subject: str,
    body: str,
) -> None:
    if not inbox_enabled():
        return
    root = _inbox_dir()
    payload = {
        'subject': subject,
        'body': body,
        'recipients': [r.lower() for r in recipients],
    }
    for email in recipients:
        target = root / f'{_safe_email(email)}.json'
        try:
            target.write_text(json.dumps(payload), encoding='utf-8')
        except OSError as exc:
            logger.warning('Mail inbox write failed: %s', exc)


def read_last_mail(email: str) -> dict | None:
    if not inbox_enabled():
        return None
    target = _inbox_dir() / f'{_safe_email(email)}.json'
    if not target.exists():
        return None
    try:
        data = json.loads(target.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    return data


def extract_code(body: str) -> str | None:
    match = re.search(r'\b(\d{6})\b', body or '')
    return match.group(1) if match else None
