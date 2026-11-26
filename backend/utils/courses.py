"""Course catalog helpers used by API views."""

from __future__ import annotations

from django.db.models import Count, Prefetch, Q, QuerySet
from django.shortcuts import get_object_or_404

from courses.models import CourseModule, Courses


def list_courses(search: str | None = None) -> QuerySet[Courses]:
    qs = Courses.objects.annotate(
        module_count=Count('course_modules'),
    ).order_by('courses_name')
    if search:
        qs = qs.filter(
            Q(courses_name__icontains=search) | Q(courses_description__icontains=search)
        )
    return qs


def get_course_by_slug(slug: str) -> Courses:
    return get_object_or_404(
        Courses.objects.prefetch_related(
            Prefetch(
                'course_modules',
                queryset=CourseModule.objects.order_by('sort_order', 'id'),
            )
        ),
        slug=slug,
    )
