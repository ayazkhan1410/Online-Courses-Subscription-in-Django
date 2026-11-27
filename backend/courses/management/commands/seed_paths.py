"""Idempotent seed for learning paths from CURSOR_PROMPT_2."""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from courses.models import Category, Courses, LearningPath, PathStep

FREELANCING_SLUG = 'freelancing-and-career'

PATH_SPECS = [
    {
        'slug': 'python-from-zero',
        'title': 'Python from zero',
        'level': 'Beginner',
        'summary': (
            'Write your first program, then build small projects '
            'until Python feels natural.'
        ),
        'sort_order': 1,
        'steps': [
            (
                'PLqG7o8rLExOpOw8PH-w9x7A-chWaCueu4',
                'Start here. One lesson a day.',
            ),
            (
                'PLqG7o8rLExOqNQEbxvJdM7epWGZzr1PF1',
                'Practice what you learned.',
            ),
            (
                'PL-osiE80TeTskrapNbzXhwoFUiLCjGgY7',
                'Same topics, explained in English, with more depth.',
            ),
        ],
    },
    {
        'slug': 'django-backend-developer',
        'title': 'Django backend developer',
        'level': 'Beginner to intermediate',
        'summary': (
            'From Python basics to a deployed Django app with users, '
            'a database and an API.'
        ),
        'sort_order': 2,
        'steps': [
            ('PL-osiE80TeTskrapNbzXhwoFUiLCjGgY7', ''),
            (
                'PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p',
                'Build a full blog step by step.',
            ),
            (
                'PLzMcBGfZo4-kCLWnGmK0jUBmGLaJxvi4j',
                'Connect Django to a React frontend.',
            ),
            (
                'PLy7NrYWoggjzfAHlUusx2wuDwfCrmJYcs',
                'Package and ship it.',
            ),
        ],
    },
    {
        'slug': 'react-frontend-developer',
        'title': 'React frontend developer',
        'level': 'Beginner',
        'summary': 'Learn React the modern way, then add login and real data.',
        'sort_order': 3,
        'steps': [
            ('PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d', ''),
            ('PL0Zuz27SZ-6PrE9srvEn8nbhOOyxnWXfp', ''),
            ('PL0Zuz27SZ-6PRCpm9clX0WiBEMB70FWwd', ''),
        ],
    },
    {
        'slug': 'crack-coding-interviews',
        'title': 'Crack coding interviews',
        'level': 'Intermediate',
        'summary': (
            'Data structures and algorithms in the order '
            'most interviewers ask them.'
        ),
        'sort_order': 4,
        'steps': [
            (
                'PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O',
                'Understand the ideas first.',
            ),
            (
                'PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz',
                'Then solve problems topic by topic.',
            ),
        ],
    },
    {
        'slug': 'start-freelancing',
        'title': 'Start freelancing',
        'level': 'Beginner',
        'summary': (
            'Get your first clients once you can build something useful.'
        ),
        'sort_order': 5,
        'steps': [
            ('PLqG7o8rLExOoIVIWZCtmQI_YOlHuoXBpJ', ''),
            ('__freelancing_category__', ''),
        ],
    },
]


def _freelancing_playlist_ids() -> list[str]:
    category = Category.objects.filter(slug=FREELANCING_SLUG).first()
    if category is None:
        return [
            'PLadi8rkUyvZ6beUm6KzdEh5dUzUWU1KVE',
            'PLBpyC2XF4-63iFvz_BkuUn63Hz3kdnP21',
            'PLjVfK1-aLReJIR-ESg4bFADnMFrWvsd3l',
        ]
    return list(
        Courses.objects.filter(
            category=category,
            status=Courses.STATUS_PUBLISHED,
        )
        .exclude(youtube_playlist_id='')
        .exclude(youtube_playlist_id__isnull=True)
        .order_by('sort_order', 'id')
        .values_list('youtube_playlist_id', flat=True)
    )


def _collect_playlist_ids() -> set[str]:
    ids: set[str] = set()
    for spec in PATH_SPECS:
        for playlist_id, _note in spec['steps']:
            if playlist_id == '__freelancing_category__':
                ids.update(_freelancing_playlist_ids())
            else:
                ids.add(playlist_id)
    return ids


class Command(BaseCommand):
    help = 'Seed published learning paths (idempotent).'

    @transaction.atomic
    def handle(self, *args, **options):
        playlist_ids = _collect_playlist_ids()
        courses_by_playlist = {
            course.youtube_playlist_id: course
            for course in Courses.objects.filter(
                youtube_playlist_id__in=playlist_ids,
                status=Courses.STATUS_PUBLISHED,
            ).only('id', 'youtube_playlist_id')
        }

        path_rows: list[LearningPath] = []
        for spec in PATH_SPECS:
            path, _ = LearningPath.objects.update_or_create(
                slug=spec['slug'],
                defaults={
                    'title': spec['title'],
                    'summary': spec['summary'],
                    'level': spec['level'],
                    'sort_order': spec['sort_order'],
                    'is_published': True,
                },
            )
            path_rows.append(path)

        PathStep.objects.filter(path__in=path_rows).delete()

        steps: list[PathStep] = []
        for path, spec in zip(path_rows, PATH_SPECS, strict=True):
            order = 0
            for playlist_id, note in spec['steps']:
                ids = (
                    _freelancing_playlist_ids()
                    if playlist_id == '__freelancing_category__'
                    else [playlist_id]
                )
                if playlist_id == '__freelancing_category__':
                    step_note = ''
                else:
                    step_note = note
                for fid in ids:
                    course = courses_by_playlist.get(fid)
                    if course is None:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Skip {fid} in {path.slug} (not published)'
                            )
                        )
                        continue
                    order += 1
                    steps.append(
                        PathStep(
                            path=path,
                            course=course,
                            sort_order=order,
                            note=step_note,
                        )
                    )
                    step_note = ''

        if steps:
            PathStep.objects.bulk_create(steps, batch_size=200)
        self.stdout.write(self.style.SUCCESS('Learning paths seeded.'))
