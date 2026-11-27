"""Course catalog helpers used by API views."""

from __future__ import annotations

from django.db.models import Count, Prefetch, Q, QuerySet
from django.shortcuts import get_object_or_404

from courses.models import CourseModule, Courses


def _param(value: str | None) -> str:
    return (value or '').strip()


def list_courses(
    search: str | None = None,
    category: str | None = None,
    creator: str | None = None,
    level: str | None = None,
    language: str | None = None,
) -> QuerySet[Courses]:
    """Public catalog: published courses only."""
    qs = (
        Courses.objects.filter(status=Courses.STATUS_PUBLISHED)
        .select_related('category', 'creator')
        .annotate(module_count=Count('course_modules'))
        .order_by('sort_order', 'courses_name')
    )
    if _param(category):
        qs = qs.filter(category__slug=_param(category))
    if _param(creator):
        qs = qs.filter(creator__slug=_param(creator))
    if _param(level):
        qs = qs.filter(level=_param(level))
    if _param(language):
        qs = qs.filter(language=_param(language))
    if _param(search):
        term = _param(search)
        qs = qs.filter(
            Q(courses_name__icontains=term)
            | Q(courses_description__icontains=term)
        )
    return qs


def get_course_by_slug(slug: str, user=None) -> Courses:
    qs = Courses.objects.select_related(
        'category', 'creator'
    ).prefetch_related(
        Prefetch(
            'course_modules',
            queryset=CourseModule.objects.order_by('sort_order', 'id'),
        )
    )
    is_staff = bool(
        user
        and getattr(user, 'is_authenticated', False)
        and getattr(user, 'is_staff', False)
    )
    if not is_staff:
        qs = qs.filter(status=Courses.STATUS_PUBLISHED)
    return get_object_or_404(qs, slug=slug)
