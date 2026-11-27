"""Pillow renderer for course Open Graph images."""

from __future__ import annotations

import io
from typing import TYPE_CHECKING

from django.core.cache import cache
from PIL import Image, ImageDraw

if TYPE_CHECKING:
    from courses.models import Courses

from utils.og_completion import HEIGHT, WIDTH, _font, _tick_row

CACHE_TTL = 60 * 60 * 24
BRAND = 'Study with Ayaz'


def render_course_og(course: Courses) -> bytes:
    module_count = course.course_modules.filter(
        can_view=True,
        is_available=True,
    ).count()
    cache_key = f'og_course:v2:{course.slug}:{module_count}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    total = module_count
    title = course.courses_name[:120]
    teacher = (
        course.creator.name
        if course.creator_id and course.creator
        else BRAND
    )
    level = (course.level or 'beginner').replace('_', ' ').title()

    img = Image.new('RGB', (WIDTH, HEIGHT), (251, 247, 239))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 28, HEIGHT), fill=(59, 52, 42))
    draw.line((56, 0, 56, HEIGHT), fill=(200, 190, 175), width=1)

    label_font = _font(22, mono=True)
    title_font = _font(64, medium=True)
    meta_font = _font(28, mono=True)

    pad = 72
    draw.text((pad, 56), BRAND, fill=(120, 112, 98), font=label_font)
    draw.text((pad, 120), title, fill=(35, 32, 28), font=title_font)
    counter = f'{total} lessons · {level}'
    draw.text((pad, 280), counter, fill=(120, 112, 98), font=meta_font)
    _tick_row(draw, min(total, 50) or 1, pad, 340)
    draw.text((pad, 400), teacher, fill=(35, 32, 28), font=meta_font)
    draw.text(
        (pad, HEIGHT - 72),
        'Free course · Study with Ayaz',
        fill=(154, 144, 127),
        font=meta_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload


def render_default_og() -> bytes:
    cache_key = 'og_default:v2'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    img = Image.new('RGB', (WIDTH, HEIGHT), (251, 247, 239))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 28, HEIGHT), fill=(59, 52, 42))
    draw.line((56, 0, 56, HEIGHT), fill=(200, 190, 175), width=1)

    title_font = _font(64, medium=True)
    meta_font = _font(28, mono=True)
    pad = 72
    draw.text((pad, 180), BRAND, fill=(35, 32, 28), font=title_font)
    draw.text(
        (pad, 280),
        'Free programming courses from curated YouTube playlists.',
        fill=(120, 112, 98),
        font=meta_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload
