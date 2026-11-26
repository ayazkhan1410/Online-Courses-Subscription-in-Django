"""Cloudflare Turnstile. Verification is skipped when TURNSTILE_TEST_MODE is on."""

import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

_DEFAULT_SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'


def get_client_ip(request) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        first = forwarded.split(',')[0].strip()
        return first or None
    return request.META.get('REMOTE_ADDR')


def verify_turnstile(token: str, remote_ip: str | None = None) -> bool:
    if not token:
        return False
    if getattr(settings, 'TURNSTILE_TEST_MODE', False):
        return True
    secret = getattr(settings, 'TURNSTILE_SECRET_KEY', '') or ''
    if not secret:
        logger.error('Turnstile secret is not configured')
        return False
    payload = urllib.parse.urlencode(
        {
            'secret': secret,
            'response': token,
            'remoteip': remote_ip or '',
        }
    ).encode()
    url = getattr(settings, 'TURNSTILE_SITEVERIFY_URL', '') or _DEFAULT_SITEVERIFY
    request = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            body = json.loads(response.read().decode())
    except (
        urllib.error.URLError,
        TimeoutError,
        json.JSONDecodeError,
        ValueError,
    ):
        logger.warning('Turnstile verification unavailable')
        return False
    if not body.get('success'):
        logger.info('Turnstile rejected | errors=%s', body.get('error-codes'))
        return False
    allowed = [
        host.strip().lower()
        for host in (getattr(settings, 'TURNSTILE_ALLOWED_HOSTNAMES', '') or '').split(
            ','
        )
        if host.strip()
    ]
    if allowed:
        hostname = str(body.get('hostname', '')).lower()
        if hostname not in allowed:
            logger.info('Turnstile hostname rejected')
            return False
    return True
