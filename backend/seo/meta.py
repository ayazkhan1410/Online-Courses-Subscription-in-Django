"""Resolve SEO meta for public SPA routes."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from html import escape, unescape
from typing import Any
from urllib.parse import urljoin

from django.conf import settings
from django.utils.html import strip_tags

from courses.models import Category, Courses, LearningPath
from learning.models import Completion

SITE_NAME = 'Study with Ayaz'
_HTML_RE = re.compile(r'\s+')


@dataclass
class PageMeta:
    title: str
    description: str
    canonical: str
    og_title: str
    og_description: str
    og_image: str
    json_ld: list[dict[str, Any]] = field(default_factory=list)


def _frontend_base() -> str:
    return settings.FRONTEND_URL.rstrip('/')


def _api_base() -> str:
    return settings.API_PUBLIC_URL.rstrip('/')


def _default_og_image() -> str:
    return f'{_api_base()}/api/og/default.png'


def _plain(text: str, limit: int = 160) -> str:
    cleaned = unescape(strip_tags(text or ''))
    cleaned = _HTML_RE.sub(' ', cleaned).strip()
    if len(cleaned) <= limit:
        return cleaned
    return f'{cleaned[: limit - 1].rstrip()}…'


def _with_site(title: str) -> str:
    return f'{title} — {SITE_NAME}'


def _home() -> PageMeta:
    base = _frontend_base()
    desc = (
        'Free programming courses built from curated YouTube playlists. '
        'Track progress lesson by lesson with Study with Ayaz.'
    )
    og = _default_og_image()
    return PageMeta(
        title=_with_site(SITE_NAME),
        description=desc,
        canonical=f'{base}/',
        og_title=_with_site(SITE_NAME),
        og_description=desc,
        og_image=og,
    )


_STATIC: dict[str, tuple[str, str]] = {
    '/about': (
        'About',
        'Who runs Study with Ayaz, how the catalog works, and how to learn.',
    ),
    '/contact': ('Contact', 'Get in touch with Study with Ayaz.'),
    '/courses': (
        'Courses',
        'Browse free programming courses from curated YouTube playlists.',
    ),
    '/categories': (
        'Categories',
        'Explore course categories on Study with Ayaz.',
    ),
    '/paths': (
        'Learning paths',
        'Follow structured learning paths across multiple courses.',
    ),
    '/services': ('Services', 'What Study with Ayaz offers learners.'),
    '/faq': ('FAQ', 'Answers to common questions about Study with Ayaz.'),
    '/privacy': ('Privacy', 'Privacy policy for Study with Ayaz.'),
    '/terms': ('Terms', 'Terms of use for Study with Ayaz.'),
    '/search': ('Search', 'Search courses on Study with Ayaz.'),
}


def _static(path: str) -> PageMeta:
    base = _frontend_base()
    key = path.rstrip('/') or '/'
    if key == '/':
        return _home()
    label, desc = _STATIC.get(
        key,
        ('Page', f'Learn with {SITE_NAME}.'),
    )
    canonical = f'{base}{key}' if key != '/' else f'{base}/'
    og = _default_og_image()
    title = _with_site(label)
    return PageMeta(
        title=title,
        description=desc,
        canonical=canonical,
        og_title=title,
        og_description=desc,
        og_image=og,
    )


def _course_json_ld(
    course: Courses,
    canonical: str,
    description: str,
) -> dict[str, Any]:
    creator = (
        course.creator.name
        if course.creator_id and course.creator
        else SITE_NAME
    )
    payload: dict[str, Any] = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        'name': course.courses_name,
        'description': description,
        'url': canonical,
        'provider': {
            '@type': 'Organization',
            'name': SITE_NAME,
        },
        'creator': {
            '@type': 'Person',
            'name': creator,
        },
    }
    if course.thumbnail_url:
        payload['image'] = course.thumbnail_url
    return payload


def resolve_meta(path: str) -> PageMeta | None:
    """Return meta for a frontend path, or None to fall back to SPA nginx."""
    normalized = path if path.startswith('/') else f'/{path}'
    normalized = re.sub(r'/+', '/', normalized)
    if normalized != '/' and normalized.endswith('/'):
        normalized = normalized.rstrip('/')

    base = _frontend_base()
    segments = [part for part in normalized.split('/') if part]

    if not segments:
        return _home()

    head = segments[0]
    if head in {
        'about',
        'contact',
        'courses',
        'categories',
        'paths',
        'services',
        'faq',
        'privacy',
        'terms',
        'search',
    } and len(segments) == 1:
        return _static(normalized)

    if head == 'courses' and len(segments) == 2:
        slug = segments[1]
        course = (
            Courses.objects.filter(
                slug=slug,
                status=Courses.STATUS_PUBLISHED,
            )
            .select_related('creator')
            .first()
        )
        if course is None:
            return None
        plain = _plain(course.courses_description) or (
            f'Learn {course.courses_name} on {SITE_NAME}.'
        )
        canonical = f'{base}/courses/{slug}'
        title = _with_site(course.courses_name)
        og = f'{_api_base()}/api/og/course/{slug}.png'
        return PageMeta(
            title=title,
            description=plain,
            canonical=canonical,
            og_title=title,
            og_description=plain,
            og_image=og,
            json_ld=[_course_json_ld(course, canonical, plain)],
        )

    if head == 'categories' and len(segments) == 2:
        slug = segments[1]
        category = Category.objects.filter(slug=slug).first()
        if category is None:
            return None
        desc = _plain(category.description) or (
            f'{category.name} courses on {SITE_NAME}.'
        )
        canonical = f'{base}/categories/{slug}'
        title = _with_site(category.name)
        og = _default_og_image()
        return PageMeta(
            title=title,
            description=desc,
            canonical=canonical,
            og_title=title,
            og_description=desc,
            og_image=og,
        )

    if head == 'paths' and len(segments) == 2:
        slug = segments[1]
        path_obj = LearningPath.objects.filter(
            slug=slug,
            is_published=True,
        ).first()
        if path_obj is None:
            return None
        desc = _plain(path_obj.summary)
        canonical = f'{base}/paths/{slug}'
        title = _with_site(path_obj.title)
        og = _default_og_image()
        return PageMeta(
            title=title,
            description=desc,
            canonical=canonical,
            og_title=title,
            og_description=desc,
            og_image=og,
        )

    if head == 'done' and len(segments) == 2:
        share_id = segments[1]
        completion = (
            Completion.objects.filter(share_id=share_id)
            .select_related('course', 'course__creator')
            .first()
        )
        if completion is None:
            return None
        course = completion.course
        plain = (
            f'Completion card for {course.courses_name} on {SITE_NAME}.'
        )
        canonical = urljoin(f'{base}/', f'done/{share_id}')
        title = _with_site(f'Finished {course.courses_name}')
        og = f'{_api_base()}/api/og/done/{share_id}.png'
        return PageMeta(
            title=title,
            description=plain,
            canonical=canonical,
            og_title=title,
            og_description=plain,
            og_image=og,
        )

    return None


def _attr(value: str) -> str:
    return escape(value, quote=True)


def meta_head_tags(meta: PageMeta) -> str:
    """HTML fragment injected into the SPA shell <head>."""
    chunks = [
        f'<meta name="description" content="{_attr(meta.description)}" />',
        f'<link rel="canonical" href="{_attr(meta.canonical)}" />',
        f'<meta property="og:title" content="{_attr(meta.og_title)}" />',
        (
            '<meta property="og:description" '
            f'content="{_attr(meta.og_description)}" />'
        ),
        f'<meta property="og:image" content="{_attr(meta.og_image)}" />',
        f'<meta property="og:url" content="{_attr(meta.canonical)}" />',
        '<meta property="og:type" content="website" />',
        '<meta name="twitter:card" content="summary_large_image" />',
    ]
    for block in meta.json_ld:
        payload = _safe_json_ld(block)
        chunks.append(
            f'<script type="application/ld+json">{payload}</script>'
        )
    return '\n    '.join(chunks)


def _safe_json_ld(block: dict[str, Any]) -> str:
    """Escape JSON for embedding inside a <script> tag."""
    payload = json.dumps(block, ensure_ascii=False)
    return (
        payload.replace('<', '\\u003c')
        .replace('>', '\\u003e')
        .replace('&', '\\u0026')
    )
