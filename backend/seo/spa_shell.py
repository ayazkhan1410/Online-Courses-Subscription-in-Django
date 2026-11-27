"""Build index.html with injected SEO meta for crawlers and first paint."""

from __future__ import annotations

import logging
import re
from html import escape
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.conf import settings

from seo.meta import PageMeta, meta_head_tags

logger = logging.getLogger(__name__)

_TITLE_RE = re.compile(r'<title>[^<]*</title>', re.IGNORECASE)


def _load_index_html() -> str:
    root = Path(__file__).resolve().parent
    fallback = root / 'fixtures' / 'spa_index_fallback.html'
    internal = settings.FRONTEND_INTERNAL_URL.rstrip('/')
    url = f'{internal}/index.html'
    try:
        request = Request(url, headers={'User-Agent': 'StudyWithAyaz-SEO/1'})
        with urlopen(request, timeout=3) as response:
            return response.read().decode('utf-8')
    except (URLError, OSError, TimeoutError) as exc:
        logger.warning('SPA index fetch failed (%s), using fallback', exc)
        return fallback.read_text(encoding='utf-8')


def render_spa_shell(meta: PageMeta) -> str:
    html = _load_index_html()
    head_extra = meta_head_tags(meta)
    if '</head>' in html:
        html = html.replace('</head>', f'    {head_extra}\n  </head>', 1)
    else:
        html = f'{head_extra}\n{html}'
    safe_title = escape(meta.title, quote=False)
    html = _TITLE_RE.sub(f'<title>{safe_title}</title>', html, count=1)
    return html
