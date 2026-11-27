"""Course completion records and display helpers."""

from __future__ import annotations

from django.db.models import Count
from django.utils import timezone

from courses.models import Courses
from learning.models import Completion, LessonProgress


def learner_display_name(user) -> str:
    if not getattr(user, 'show_name_on_completion', True):
        return 'A learner'
    return (
        user.full_name
        or user.username
        or (user.email.split('@')[0] if user.email else 'Learner')
    )


def course_is_fully_complete(user, course: Courses) -> bool:
    total = course.course_modules.count()
    if total == 0:
        return False
    done = LessonProgress.objects.filter(
        user=user,
        module__course=course,
        completed=True,
    ).count()
    return done >= total


def maybe_record_completion(user, course: Courses) -> Completion | None:
    """Create a completion row once all lessons are done; never remove it."""
    existing = Completion.objects.filter(user=user, course=course).first()
    if existing is not None:
        return existing
    if not course_is_fully_complete(user, course):
        return None
    return Completion.objects.create(
        user=user,
        course=course,
        completed_at=timezone.now(),
        share_id='',
    )


def finished_month_label(completed_at) -> str:
    return completed_at.strftime('Finished %b %Y')


def list_user_completions(user):
    return (
        Completion.objects.filter(user=user)
        .select_related(
            'course',
            'course__category',
            'course__creator',
        )
        .annotate(lesson_count=Count('course__course_modules'))
        .order_by('-completed_at')
    )