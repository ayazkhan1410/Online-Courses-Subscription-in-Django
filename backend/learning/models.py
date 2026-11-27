import secrets
import string

from django.conf import settings
from django.db import models
from django.utils import timezone

from courses.models import CourseModule, Courses

_SHARE_ALPHABET = string.ascii_lowercase + string.digits


def new_completion_share_id() -> str:
    return ''.join(secrets.choice(_SHARE_ALPHABET) for _ in range(10))


class Enrollment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-last_accessed_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'course'],
                name='uniq_user_course_enrollment',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.user_id}:{self.course_id}'


class LessonProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
    )
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='progress_rows',
    )
    completed = models.BooleanField(default=False)
    position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'module'],
                name='uniq_user_module_progress',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.user_id}:{self.module_id}:{self.completed}'


class LessonNote(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_notes',
    )
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='notes',
    )
    seconds = models.PositiveIntegerField(default=0)
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self) -> str:
        return f'{self.user_id}:{self.module_id}@{self.seconds}'


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
    )
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='wishlisted_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'course'],
                name='uniq_user_course_wishlist',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.user_id}:{self.course_id}'


class Completion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    completed_at = models.DateTimeField(default=timezone.now)
    share_id = models.CharField(max_length=10, unique=True, db_index=True)

    class Meta:
        ordering = ['-completed_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'course'],
                name='uniq_user_course_completion',
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.share_id:
            for _ in range(24):
                candidate = new_completion_share_id()
                if not Completion.objects.filter(share_id=candidate).exists():
                    self.share_id = candidate
                    break
            if not self.share_id:
                raise RuntimeError('Could not allocate completion share_id')
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f'{self.share_id}:{self.user_id}:{self.course_id}'
