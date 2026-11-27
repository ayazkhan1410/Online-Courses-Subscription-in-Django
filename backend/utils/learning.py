"""Enrollment, progress, wishlist, and dashboard helpers."""

from __future__ import annotations

from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

from courses.models import CourseModule, Courses
from learning.models import Enrollment, LessonProgress, WishlistItem
from subscriptions.models import Subscription


def serializer_learning_context(user, course: Courses | None = None) -> dict:
    """Ids/maps for course serializers. Empty for anonymous users."""
    if user is None or not user.is_authenticated:
        return {}

    enrolled_ids = set(
        Enrollment.objects.filter(user=user).values_list(
            'course_id', flat=True
        )
    )
    wishlist_ids = set(
        WishlistItem.objects.filter(user=user).values_list(
            'course_id', flat=True
        )
    )
    is_pro = Subscription.objects.filter(user=user, is_pro=True).exists()
    context = {
        'enrolled_ids': enrolled_ids,
        'wishlist_ids': wishlist_ids,
        'progress_map': progress_for_courses(user, enrolled_ids),
        'is_pro': is_pro or user.is_staff,
    }
    if course is not None:
        rows = list(
            LessonProgress.objects.filter(
                user=user,
                module__course=course,
            ).values_list('module_id', 'completed', 'position_seconds')
        )
        completed = {mid for mid, done, _ in rows if done}
        position_map = {mid: pos for mid, _, pos in rows}
        total = course.course_modules.count()
        context['completed_module_ids'] = completed
        context['position_map'] = position_map
        context['progress_map'][course.id] = (
            int(round(100 * len(completed) / total)) if total else 0
        )
    return context


def progress_for_courses(user, course_ids: set[int]) -> dict[int, int]:
    if not course_ids:
        return {}

    totals = dict(
        Courses.objects.filter(id__in=course_ids)
        .annotate(n=Count('course_modules'))
        .values_list('id', 'n')
    )
    done_rows = (
        LessonProgress.objects.filter(
            user=user,
            completed=True,
            module__course_id__in=course_ids,
        )
        .values('module__course_id')
        .annotate(done=Count('id'))
    )
    done_map = {row['module__course_id']: row['done'] for row in done_rows}
    return {
        cid: (int(round(100 * done_map.get(cid, 0) / total)) if total else 0)
        for cid, total in totals.items()
    }


def enroll_user(user, course: Courses) -> Enrollment:
    enrollment, _ = Enrollment.objects.get_or_create(user=user, course=course)
    enrollment.last_accessed_at = timezone.now()
    enrollment.save(update_fields=['last_accessed_at'])
    return enrollment


def list_enrollments(user):
    return (
        Enrollment.objects.filter(user=user)
        .select_related('course')
        .order_by('-last_accessed_at')
    )


def mark_lesson_progress(
    user, module_id: int, completed: bool = True
) -> LessonProgress:
    module = get_object_or_404(CourseModule, pk=module_id)
    enrollment = Enrollment.objects.filter(
        user=user, course=module.course
    ).first()
    if enrollment is None:
        raise PermissionError('Enroll in this course before tracking progress')

    progress, _ = LessonProgress.objects.update_or_create(
        user=user,
        module=module,
        defaults={'completed': completed},
    )
    enrollment.last_accessed_at = timezone.now()
    enrollment.save(update_fields=['last_accessed_at'])
    return progress


def save_lesson_position(
    user, module_id: int, seconds: int
) -> LessonProgress:
    """Persist watch position; auto-complete at 90% when duration is known."""
    module = get_object_or_404(CourseModule, pk=module_id)
    enrollment = Enrollment.objects.filter(
        user=user, course=module.course
    ).first()
    if enrollment is None:
        raise PermissionError('Enroll in this course before tracking progress')

    safe_seconds = max(0, int(seconds))
    defaults: dict = {'position_seconds': safe_seconds}
    duration = int(module.duration_seconds or 0)
    if duration > 0 and safe_seconds >= int(duration * 0.9):
        defaults['completed'] = True

    progress, _ = LessonProgress.objects.update_or_create(
        user=user,
        module=module,
        defaults=defaults,
    )
    enrollment.last_accessed_at = timezone.now()
    enrollment.save(update_fields=['last_accessed_at'])
    return progress


def resume_seconds(
    position: int, duration: int | None = None
) -> int:
    """Client resume rule: last 15s → 0, else max(0, position - 3)."""
    pos = max(0, int(position or 0))
    dur = int(duration or 0)
    if dur > 0 and pos >= max(0, dur - 15):
        return 0
    if pos <= 3:
        return 0
    return pos - 3


def list_wishlist(user):
    return (
        WishlistItem.objects.filter(user=user)
        .select_related('course')
        .order_by('-created_at')
    )


def add_wishlist(user, slug: str) -> tuple[WishlistItem, bool]:
    course = get_object_or_404(Courses, slug=slug)
    return WishlistItem.objects.get_or_create(user=user, course=course)


def remove_wishlist(user, slug: str) -> None:
    course = get_object_or_404(Courses, slug=slug)
    WishlistItem.objects.filter(user=user, course=course).delete()


def build_dashboard(user) -> dict:
    from courses.serializers import CourseSerializer
    from learning.serializers import EnrollmentSerializer, WishlistSerializer

    enrollments = list(
        Enrollment.objects.filter(user=user)
        .select_related('course')
        .prefetch_related(
            Prefetch(
                'course__course_modules',
                queryset=CourseModule.objects.only('id', 'course_id'),
            )
        )
        .order_by('-last_accessed_at')
    )
    enrolled_ids = {e.course_id for e in enrollments}
    progress_map = progress_for_courses(user, enrolled_ids)
    wishlist_ids = set(
        WishlistItem.objects.filter(user=user).values_list(
            'course_id', flat=True
        )
    )
    completed_lessons = LessonProgress.objects.filter(
        user=user,
        completed=True,
        module__course_id__in=enrolled_ids,
    ).count()

    wishlist = list_wishlist(user)[:12]
    recent = enrollments[:6]
    continue_learning = [
        e for e in recent if progress_map.get(e.course_id, 0) < 100
    ][:4]
    recommended = (
        Courses.objects.filter(status=Courses.STATUS_PUBLISHED)
        .annotate(module_count=Count('course_modules'))
        .exclude(id__in=enrolled_ids)
        .order_by('sort_order', 'courses_name')[:8]
    )
    is_pro = Subscription.objects.filter(user=user, is_pro=True).exists()
    display_name = (
        user.full_name
        or user.username
        or (user.email.split('@')[0] if user.email else 'Learner')
    )

    request_stub = type('R', (), {'user': user})()
    ser_ctx = {
        'request': request_stub,
        'enrolled_ids': enrolled_ids,
        'wishlist_ids': wishlist_ids,
        'progress_map': progress_map,
    }

    def ser_course(course):
        return CourseSerializer(course, context=ser_ctx).data

    completed_courses = sum(1 for pct in progress_map.values() if pct >= 100)
    return {
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name,
            'display_name': display_name,
            'is_pro': is_pro,
        },
        'stats': {
            'enrolled_courses': len(enrollments),
            'completed_courses': completed_courses,
            'completed_lessons': completed_lessons,
            'wishlist_count': len(wishlist_ids),
            'avg_progress': (
                int(round(sum(progress_map.values()) / len(progress_map)))
                if progress_map
                else 0
            ),
        },
        'enrolled': EnrollmentSerializer(
            enrollments, many=True, context=ser_ctx
        ).data,
        'continue_learning': [
            {
                **ser_course(e.course),
                'last_accessed_at': e.last_accessed_at,
                'progress_percent': progress_map.get(e.course_id, 0),
            }
            for e in continue_learning
        ],
        'recent': [
            {
                **ser_course(e.course),
                'last_accessed_at': e.last_accessed_at,
                'progress_percent': progress_map.get(e.course_id, 0),
            }
            for e in recent
        ],
        'wishlist': WishlistSerializer(
            wishlist, many=True, context=ser_ctx
        ).data,
        'recommended': [ser_course(c) for c in recommended],
    }
