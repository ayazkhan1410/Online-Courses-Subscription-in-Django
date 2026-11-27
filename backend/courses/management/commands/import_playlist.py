"""Import one YouTube playlist into the course catalog."""

from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from courses.models import Category, Courses
from courses.services.playlist_import import (
    PlaylistImportError,
    import_playlist,
)


class Command(BaseCommand):
    help = (
        'Import a YouTube playlist. '
        'Published when --publish is set, the category is study-with-ayaz, '
        'or the creator is the channel owner. Otherwise pending review.'
    )

    def add_arguments(self, parser):
        parser.add_argument('playlist_url', type=str)
        parser.add_argument('--category', type=str, required=True)
        parser.add_argument('--publish', action='store_true')
        parser.add_argument(
            '--level', type=str, default=Courses.LEVEL_BEGINNER
        )
        parser.add_argument(
            '--language', type=str, default=Courses.LANGUAGE_EN
        )

    def handle(self, *args, **options):
        category = Category.objects.filter(slug=options['category']).first()
        if category is None:
            raise CommandError(f'Unknown category: {options["category"]}')
        try:
            course = import_playlist(
                options['playlist_url'],
                category=category,
                level=options['level'],
                language=options['language'],
                publish=options['publish'],
            )
        except PlaylistImportError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(
            self.style.SUCCESS(
                f'Imported {course.courses_name} '
                f'({course.status}) [{course.slug}]'
            )
        )
