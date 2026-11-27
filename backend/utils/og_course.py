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
    module_count = course.course_modules.filter(can_view=True).count()
    cache_key = f'og_course:{course.slug}:{module_count}'
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
    draw.line((44, 0, 44, HEIGHT), fill=(200, 190, 175), width=1)

    label_font = _font(22)
    title_font = _font(52, bold=True)
    meta_font = _font(20)

    draw.text((72, 56), BRAND, fill=(120, 112, 98), font=label_font)
    draw.text((72, 110), title, fill=(35, 32, 28), font=title_font)
    counter = f'{total} lessons · {level}'
    draw.text((72, 240), counter, fill=(120, 112, 98), font=label_font)
    _tick_row(draw, min(total, 24) or 1, 72, 290)
    draw.text((72, 380), teacher, fill=(35, 32, 28), font=meta_font)
    draw.text(
        (72, HEIGHT - 64),
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
    cache_key = 'og_default:1'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    img = Image.new('RGB', (WIDTH, HEIGHT), (251, 247, 239))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 28, HEIGHT), fill=(59, 52, 42))
    draw.line((44, 0, 44, HEIGHT), fill=(200, 190, 175), width=1)

    title_font = _font(56, bold=True)
    meta_font = _font(24)
    draw.text((72, 180), BRAND, fill=(35, 32, 28), font=title_font)
    draw.text(
        (72, 280),
        'Free programming courses from curated playlists',
        fill=(120, 112, 98),
        font=meta_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload
