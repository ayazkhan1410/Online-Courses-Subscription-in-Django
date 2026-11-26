from ckeditor.fields import RichTextField
from django.db import models
from django.utils.text import slugify
from embed_video.fields import EmbedVideoField


class Courses(models.Model):
    courses_name = models.CharField(max_length=255)
    courses_description = RichTextField(blank=True, default='')
    is_premium = models.BooleanField(default=False)
    course_image = models.ImageField(
        upload_to='courses',
        blank=True,
        null=True,
    )
    thumbnail_url = models.URLField(max_length=500, blank=True, default='')
    youtube_playlist_id = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
    )
    playlist_url = models.URLField(max_length=500, blank=True, default='')
    slug = models.SlugField(max_length=255, blank=True, unique=True)

    class Meta:
        ordering = ['courses_name']
        verbose_name_plural = 'Courses'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.courses_name)[:200] or 'course'
            candidate = base
            n = 1
            while Courses.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                n += 1
                candidate = f'{base}-{n}'
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.courses_name


class CourseModule(models.Model):
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='course_modules',
    )
    module_name = models.CharField(max_length=255)
    module_description = RichTextField(blank=True, default='')
    module_video = EmbedVideoField(max_length=500, blank=True, default='')
    youtube_video_id = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        default=None,
    )
    thumbnail_url = models.URLField(max_length=500, blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)
    can_view = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'youtube_video_id'],
                name='uniq_course_youtube_video',
            ),
        ]

    def __str__(self) -> str:
        return self.module_name
