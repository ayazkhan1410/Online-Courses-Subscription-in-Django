"""Streak and daily-goal stats from lesson completions."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta, timezone as dt_utc
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone as dj_timezone

from learning.models import LessonProgress

WEEKDAY_LABELS = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')
DEFAULT_TZ = 'Asia/Karachi'


def _user_zone(tz_name: str | None) -> ZoneInfo:
    name = (tz_name or '').strip() or DEFAULT_TZ
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_TZ)


def _local_date(dt, tz: ZoneInfo) -> date:
    if dj_timezone.is_naive(dt):
        dt = dj_timezone.make_aware(dt, dt_utc.utc)
    return dt.astimezone(tz).date()


def completion_counts_by_day(user) -> dict[date, int]:
    """Lesson completions per local calendar day (completed rows)."""
    tz = _user_zone(getattr(user, 'timezone', None))
    counts: dict[date, int] = defaultdict(int)
    rows = LessonProgress.objects.filter(
        user=user,
        completed=True,
    ).values_list('updated_at', flat=True)
    for updated in rows:
        counts[_local_date(updated, tz)] += 1
    return counts


def _current_streak(active_days: set[date], today: date) -> int:
    if not active_days:
        return 0
    yesterday = today - timedelta(days=1)
    if today in active_days:
        cursor = today
    elif yesterday in active_days:
        cursor = yesterday
    else:
        return 0
    streak = 0
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _longest_streak(active_days: set[date]) -> int:
    if not active_days:
        return 0
    best = 1
    run = 1
    sorted_days = sorted(active_days)
    for idx in range(1, len(sorted_days)):
        if sorted_days[idx] == sorted_days[idx - 1] + timedelta(days=1):
            run += 1
        else:
            best = max(best, run)
            run = 1
    return max(best, run)


def build_streak_payload(user) -> dict:
    tz = _user_zone(getattr(user, 'timezone', None))
    today = dj_timezone.now().astimezone(tz).date()
    daily_goal = int(getattr(user, 'daily_goal', 1) or 1)
    daily_goal = min(3, max(1, daily_goal))

    counts = completion_counts_by_day(user)
    active_days = {day for day, n in counts.items() if n >= 1}
    week_start = today - timedelta(days=today.weekday())
    week = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        lesson_count = counts.get(day, 0)
        week.append(
            {
                'weekday': WEEKDAY_LABELS[offset],
                'date': day.isoformat(),
                'lesson_count': lesson_count,
                'goal_met': lesson_count >= daily_goal,
                'is_today': day == today,
            }
        )
    return {
        'current': _current_streak(active_days, today),
        'longest': _longest_streak(active_days),
        'daily_goal': daily_goal,
        'week': week,
    }