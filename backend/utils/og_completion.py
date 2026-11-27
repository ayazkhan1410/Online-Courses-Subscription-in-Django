"""Pillow renderer for completion card Open Graph images."""

from __future__ import annotations

import io
from typing import TYPE_CHECKING

from django.core.cache import cache
from PIL import Image, ImageDraw, ImageFont

if TYPE_CHECKING:
    from learning.models import Completion

WIDTH = 1200
HEIGHT = 630
CACHE_TTL = 60 * 60 * 24


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    paths = (
        [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        ]
        if bold
        else [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        ]
    )
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _tick_row(draw: ImageDraw.ImageDraw, total: int, x: int, y: int) -> None:
    n = min(max(total, 1), 24)
    gap = 6
    tick_w = 10
    for i in range(n):
        left = x + i * (tick_w + gap)
        draw.rectangle(
            (left, y, left + tick_w, y + 22),
            fill=(59, 52, 42),
        )


def render_completion_og(completion: Completion, learner_name: str) -> bytes:
    cache_key = (
        f'og_done:{completion.share_id}:'
        f'{int(completion.user.show_name_on_completion)}'
    )
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    course = completion.course
    total = course.course_modules.count()
    title = course.courses_name[:120]
    finished = completion.completed_at.strftime('Finished %b %Y')
    teacher = (
        course.creator.name
        if course.creator_id and course.creator
        else 'Study with Ayaz'
    )

    img = Image.new('RGB', (WIDTH, HEIGHT), (251, 247, 239))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 28, HEIGHT), fill=(59, 52, 42))
    draw.line((44, 0, 44, HEIGHT), fill=(200, 190, 175), width=1)

    title_font = _font(52, bold=True)
    meta_font = _font(22)
    small_font = _font(20)

    draw.text((72, 56), finished, fill=(120, 112, 98), font=meta_font)
    draw.text((72, 110), title, fill=(35, 32, 28), font=title_font)
    counter = f'{total} / {total} lessons'
    draw.text((72, 230), counter, fill=(120, 112, 98), font=meta_font)
    _tick_row(draw, total, 72, 280)
    draw.text((72, 340), learner_name, fill=(35, 32, 28), font=meta_font)
    on_study = f'{teacher} on Study with Ayaz'
    draw.text((72, 400), on_study, fill=(120, 112, 98), font=small_font)
    draw.text(
        (72, HEIGHT - 64),
        'Completion record · not a certificate',
        fill=(154, 144, 127),
        font=small_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload