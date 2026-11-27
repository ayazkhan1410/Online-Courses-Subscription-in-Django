"""Match frontend cleanLessonTitle for plain-text emails."""

from __future__ import annotations

import re


def clean_lesson_title(raw: str | None) -> tuple[str | None, str]:
    value = (raw or '').strip()
    value = re.sub(r'\s*\|\s*.*$', '', value).strip()

    day_match = re.match(
        r'^(day\s*(\d{1,3}))\s*(?:/\s*(\d{1,3}))?\s*[-–—:]\s*(.+)$',
        value,
        flags=re.IGNORECASE,
    )
    if day_match:
        n = str(int(day_match.group(2))).zfill(2)
        total = day_match.group(3)
        counter = f'Day {n}'
        if total:
            counter = f'{counter} of {int(total)}'
        title = _sentence_case(day_match.group(4))
        return counter, title

    lesson_match = re.match(
        r'^(lesson\s*(\d{1,3}))\s*[-–—:]\s*(.+)$',
        value,
        flags=re.IGNORECASE,
    )
    if lesson_match:
        n = str(int(lesson_match.group(2))).zfill(2)
        title = _sentence_case(lesson_match.group(3))
        return f'Lesson {n}', title

    return None, _sentence_case(value)


def _sentence_case(input_value: str) -> str:
    trimmed = re.sub(r'\s+', ' ', input_value).strip()
    if not trimmed:
        return ''
    lower = trimmed.lower()
    return lower[0].upper() + lower[1:]
