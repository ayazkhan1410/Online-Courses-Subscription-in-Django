from django.conf import settings
from django.db import models
from django.utils import timezone

from courses.models import CourseModule, Courses


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
