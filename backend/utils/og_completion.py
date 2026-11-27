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
PAD = 72
TITLE_MAX_WIDTH = WIDTH - PAD * 2
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


def _ellipsis_to_width(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: float,
) -> str:
    if font.getlength(text) <= max_width:
        return text
    ellipsis = '…'
    lo, hi = 0, len(text)
    best = ellipsis
    while lo <= hi:
        mid = (lo + hi) // 2
        candidate = f'{text[:mid].rstrip()}{ellipsis}'
        if font.getlength(candidate) <= max_width:
            best = candidate
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def _wrap_words(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: float,
) -> list[str]:
    words = text.split()
    if not words:
        return ['']
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f'{current} {word}'
        if font.getlength(trial) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    fitted: list[str] = []
    for line in lines:
        if font.getlength(line) <= max_width:
            fitted.append(line)
            continue
        chunk = ''
        for char in line:
            trial = f'{chunk}{char}'
            if font.getlength(trial) <= max_width:
                chunk = trial
            else:
                if chunk:
                    fitted.append(chunk)
                chunk = char
        if chunk:
            fitted.append(chunk)
    return fitted


def fit_og_title(
    text: str,
) -> tuple[list[str], ImageFont.FreeTypeFont]:
    """Wrap to ≤2 lines; try 64px, then 52px, then ellipsis at 52px."""
    cleaned = ' '.join((text or '').split())[:200]
    max_w = float(TITLE_MAX_WIDTH)
    for size in (64, 52):
        font = _font(size, medium=True)
        lines = _wrap_words(cleaned, font, max_w)
        if len(lines) <= 2 and all(
            font.getlength(line) <= max_w for line in lines
        ):
            return lines, font
    font = _font(52, medium=True)
    lines = _wrap_words(cleaned, font, max_w)
    if len(lines) <= 1:
        return [_ellipsis_to_width(lines[0], font, max_w)], font
    if len(lines) == 2:
        return [
            _ellipsis_to_width(lines[0], font, max_w),
            _ellipsis_to_width(lines[1], font, max_w),
        ], font
    first = _ellipsis_to_width(lines[0], font, max_w)
    rest = ' '.join(lines[1:])
    return [first, _ellipsis_to_width(rest, font, max_w)], font


def draw_og_title(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont,
    *,
    x: int,
    y: int,
    fill: tuple[int, int, int],
) -> int:
    """Draw title lines; return y just below the last line."""
    ascent, descent = font.getmetrics()
    line_h = ascent + descent + 10
    for index, line in enumerate(lines):
        draw.text((x, y + index * line_h), line, fill=fill, font=font)
    return y + max(len(lines), 1) * line_h


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
        f'og_done:v3:{completion.share_id}:'
        f'{int(completion.user.show_name_on_completion)}'
    )
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    course = completion.course
    total = course.course_modules.filter(is_available=True).count()
    title_lines, title_font = fit_og_title(course.courses_name)
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

    meta_font = _font(28, mono=True)
    small_font = _font(22)

    draw.text((PAD, 56), finished, fill=(120, 112, 98), font=meta_font)
    title_bottom = draw_og_title(
        draw,
        title_lines,
        title_font,
        x=PAD,
        y=120,
        fill=(35, 32, 28),
    )
    counter_y = max(title_bottom + 20, 260)
    counter = f'{total} / {total} lessons'
    draw.text((PAD, counter_y), counter, fill=(120, 112, 98), font=meta_font)
    _tick_row(draw, total, PAD, counter_y + 60)
    draw.text(
        (PAD, counter_y + 120),
        learner_name,
        fill=(35, 32, 28),
        font=meta_font,
    )
    on_study = f'{teacher} on Study with Ayaz'
    draw.text(
        (PAD, counter_y + 170),
        on_study,
        fill=(120, 112, 98),
        font=small_font,
    )
    draw.text(
        (PAD, HEIGHT - 72),
        'Completion record · not a certificate',
        fill=(154, 144, 127),
        font=small_font,
    )

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    payload = buf.getvalue()
    cache.set(cache_key, payload, CACHE_TTL)
    return payload
