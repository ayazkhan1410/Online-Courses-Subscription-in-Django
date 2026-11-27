"""Send opt-in weekly next-lesson reminder emails."""

from __future__ import annotations

from django.core.management.base import BaseCommand

from accounts.utils.weekly_reminder import (
    iter_reminder_candidates,
    send_weekly_reminder,
)


class Command(BaseCommand):
    help = (
        'Email opted-in learners who have been idle for 3+ days '
        '(at most once per 7 days).'
    )

    def handle(self, *args, **options):
        sent = 0
        skipped = 0
        for user in iter_reminder_candidates():
            if send_weekly_reminder(user):
                sent += 1
            else:
                skipped += 1
        self.stdout.write(
            self.style.SUCCESS(
                f'Weekly reminders sent: {sent} (skipped: {skipped})'
            )
        )
