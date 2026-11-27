"""Opt-in weekly next-lesson reminder emails."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Prefetch
from django.utils import timezone

from accounts.models import CustomUser
from courses.models import CourseModule, Courses
from learning.models import Enrollment, LessonProgress
from utils.inbox import record_outbound_mail
from utils.learning import progress_for_courses
from utils.lesson_title import clean_lesson_title

logger = logging.getLogger(__name__)

IDLE_DAYS = 3
REMINDER_COOLDOWN_DAYS = 7


def _api_base() -> str:
    return settings.API_PUBLIC_URL.rstrip('/')


def _frontend_base() -> str:
    return settings.FRONTEND_URL.rstrip('/')


def unsubscribe_url(token: str) -> str:
    """Human-facing React page."""
    return f'{_frontend_base()}/unsubscribe/{token}'


def unsubscribe_api_url(token: str) -> str:
    """One-click List-Unsubscribe endpoint (GET/POST)."""
    return f'{_api_base()}/email/unsubscribe/{token}/'


def _lesson_day_label(module: CourseModule, total: int) -> str:
    counter, _ = clean_lesson_title(module.module_name)
    if counter and ' of ' in counter:
        return counter
    if counter:
        return f'{counter} of {total}'
    index = module.sort_order or 1
    width = max(2, len(str(total)))
    return f'Day {str(index).zfill(width)} of {total}'


def pick_next_lesson(
    user: CustomUser,
) -> tuple[Courses, CourseModule] | None:
    enrollments = list(
        Enrollment.objects.filter(user=user)
        .select_related('course')
        .prefetch_related(
            Prefetch(
                'course__course_modules',
                queryset=CourseModule.objects.order_by('sort_order', 'id'),
            )
        )
        .order_by('-last_accessed_at')
    )
    if not enrollments:
        return None

    course_ids = {e.course_id for e in enrollments}
    progress_map = progress_for_courses(user, course_ids)
    completed_ids = set(
        LessonProgress.objects.filter(
            user=user,
            completed=True,
            module__course_id__in=course_ids,
        ).values_list('module_id', flat=True)
    )
    for enrollment in enrollments:
        course = enrollment.course
        if progress_map.get(course.id, 0) >= 100:
            continue
        modules = list(course.course_modules.all())
        if not modules:
            continue
        next_module = next(
            (m for m in modules if m.id not in completed_ids),
            None,
        )
        if next_module is None:
            continue
        return course, next_module
    return None


def user_needs_reminder(user: CustomUser, now) -> bool:
    if not user.weekly_email:
        return False
    if not Enrollment.objects.filter(user=user).exists():
        return False
    idle_cutoff = now - timedelta(days=IDLE_DAYS)
    if LessonProgress.objects.filter(
        user=user,
        completed=True,
        updated_at__gte=idle_cutoff,
    ).exists():
        return False
    if user.last_reminder_at:
        cooldown = now - timedelta(days=REMINDER_COOLDOWN_DAYS)
        if user.last_reminder_at >= cooldown:
            return False
    return pick_next_lesson(user) is not None


def _ensure_unsubscribe_token(user: CustomUser) -> None:
    if user.unsubscribe_token:
        return
    user.save()


def send_weekly_reminder(user: CustomUser) -> bool:
    target = pick_next_lesson(user)
    if target is None:
        return False
    course, module = target
    _ensure_unsubscribe_token(user)
    fresh = CustomUser.objects.get(pk=user.pk)
    unsub_page = unsubscribe_url(fresh.unsubscribe_token)
    unsub_api = unsubscribe_api_url(fresh.unsubscribe_token)
    _, lesson_title = clean_lesson_title(module.module_name)
    total = course.course_modules.count()
    day_label = _lesson_day_label(module, total)
    lesson_link = f'{_frontend_base()}/learn/{course.slug}/{module.id}'
    subject = f'Your next lesson: {lesson_title}'
    body = (
        f'Course: {course.courses_name}\n'
        f'{day_label}\n\n'
        f'Continue here:\n{lesson_link}\n\n'
        f'Unsubscribe from weekly reminders:\n{unsub_page}\n'
    )
    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        message = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email,
            to=[user.email],
            headers={
                'List-Unsubscribe': f'<{unsub_api}>',
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
        )
        message.send(fail_silently=False)
    except Exception as exc:
        logger.error(
            'Weekly reminder failed | user_id=%s error=%s',
            user.pk,
            type(exc).__name__,
        )
        return False
    record_outbound_mail([user.email], subject, body)
    now = timezone.now()
    CustomUser.objects.filter(pk=user.pk).update(last_reminder_at=now)
    logger.info('Weekly reminder sent | user_id=%s', user.pk)
    return True


def iter_reminder_candidates(now=None):
    if now is None:
        now = timezone.now()
    qs = CustomUser.objects.filter(weekly_email=True).distinct()
    for user in qs.iterator():
        if user_needs_reminder(user, now):
            yield user
