"""Pillow renderer for completion card Open Graph images."""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import TYPE_CHECKING

from django.core.cache import cache
from PIL import Image, ImageDraw, ImageFont

if TYPE_CHECKING:
    from learning.models import Completion

logger = logging.getLogger(__name__)

WIDTH = 1200
HEIGHT = 630
CACHE_TTL = 60 * 60 * 24
_FONTS_DIR = Path(__file__).resolve().parent.parent / 'static' / 'fonts'
_SANS = _FONTS_DIR / 'InstrumentSans-Regular.ttf'
_SANS_MED = _FONTS_DIR / 'InstrumentSans-Medium.ttf'
_MONO = _FONTS_DIR / 'JetBrainsMono-Regular.ttf'


class OgFontError(RuntimeError):
    """Raised when bundled OG fonts cannot be loaded."""


def _font(
    size: int,
    *,
    mono: bool = False,
    medium: bool = False,
) -> ImageFont.FreeTypeFont:
    path = _MONO if mono else (_SANS_MED if medium else _SANS)
    try:
        return ImageFont.truetype(str(path), size)
    except OSError as exc:
        raise OgFontError(f'Could not load OG font: {path}') from exc


def assert_og_fonts_load() -> None:
    """Fail loudly if bundled fonts are missing (used in tests)."""
    for path in (_SANS, _SANS_MED, _MONO):
        if not path.is_file():
            raise OgFontError(f'Missing font file: {path}')
    _font(64, medium=True)
    _font(28, mono=True)


def _tick_row(draw: ImageDraw.ImageDraw, total: int, x: int, y: int) -> None:
    """Thin 4px-wide bars, matching the web .ticks look."""
    n = min(max(total, 1), 50)
    gap = 3
    tick_w = 4
    tick_h = 18
    for i in range(n):
        left = x + i * (tick_w + gap)
        draw.rectangle(
            (left, y, left + tick_w, y + tick_h),
            fill=(59, 52, 42),
        )


def render_completion_og(completion: Completion, learner_name: str) -> bytes:
    cache_key = (
        f'og_done:v2:{completion.share_id}:'
        f'{int(completion.user.show_name_on_completion)}'
    )
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    course = completion.course
    total = course.course_modules.filter(is_available=True).count()
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
    draw.line((56, 0, 56, HEIGHT), fill=(200, 190, 175), width=1)

    title_font = _font(64, medium=True)
    meta_font = _font(28, mono=True)
    small_font = _font(22)

    pad = 72
    draw.text((pad, 56), finished, fill=(120, 112, 98), font=meta_font)
    draw.text((pad, 120), title, fill=(35, 32, 28), font=title_font)
    counter = f'{total} / {total} lessons'
    draw.text((pad, 260), counter, fill=(120, 112, 98), font=meta_font)
    _tick_row(draw, total, pad, 320)
    draw.text((pad, 380), learner_name, fill=(35, 32, 28), font=meta_font)
    on_study = f'{teacher} on Study with Ayaz'
    draw.text((pad, 430), on_study, fill=(120, 112, 98), font=small_font)
    draw.text(
        (pad, HEIGHT - 72),
        'Completion record · not a certificate',
        fill=(154, 144, 127),
        font=small_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload
