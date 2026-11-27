from ckeditor.fields import RichTextField
from django.db import models
from django.utils.text import slugify
from embed_video.fields import EmbedVideoField


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=64, blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self) -> str:
        return self.name


class Creator(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    youtube_channel_id = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
        null=True,
    )
    channel_url = models.URLField(max_length=500, blank=True, default='')
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    is_owner = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Courses(models.Model):
    STATUS_PUBLISHED = 'published'
    STATUS_PENDING = 'pending_review'
    STATUS_HIDDEN = 'hidden'
    STATUS_CHOICES = [
        (STATUS_PUBLISHED, 'Published'),
        (STATUS_PENDING, 'Pending review'),
        (STATUS_HIDDEN, 'Hidden'),
    ]

    LEVEL_BEGINNER = 'beginner'
    LEVEL_INTERMEDIATE = 'intermediate'
    LEVEL_ADVANCED = 'advanced'
    LEVEL_CHOICES = [
        (LEVEL_BEGINNER, 'Beginner'),
        (LEVEL_INTERMEDIATE, 'Intermediate'),
        (LEVEL_ADVANCED, 'Advanced'),
    ]

    LANGUAGE_EN = 'en'
    LANGUAGE_UR = 'ur'
    LANGUAGE_HI = 'hi'
    LANGUAGE_UR_HI = 'ur-hi'
    LANGUAGE_CHOICES = [
        (LANGUAGE_EN, 'English'),
        (LANGUAGE_UR, 'Urdu'),
        (LANGUAGE_HI, 'Hindi'),
        (LANGUAGE_UR_HI, 'Urdu / Hindi'),
    ]

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
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='courses',
    )
    creator = models.ForeignKey(
        Creator,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='courses',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        blank=True,
        default=LEVEL_BEGINNER,
    )
    language = models.CharField(
        max_length=16,
        choices=LANGUAGE_CHOICES,
        blank=True,
        default=LANGUAGE_EN,
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'courses_name']
        verbose_name_plural = 'Courses'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.courses_name)[:200] or 'course'
            candidate = base
            n = 1
            while (
                Courses.objects.filter(slug=candidate)
                .exclude(pk=self.pk)
                .exists()
            ):
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
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
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


class LearningPath(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    summary = models.TextField()
    level = models.CharField(max_length=64)
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ['sort_order', 'title']

    def __str__(self) -> str:
        return self.title


class PathStep(models.Model):
    path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name='steps',
    )
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='path_steps',
    )
    sort_order = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['sort_order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['path', 'course'],
                name='uniq_path_step_course',
            ),
            models.UniqueConstraint(
                fields=['path', 'sort_order'],
                name='uniq_path_step_order',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.path.title} step {self.sort_order}'


class Project(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    summary = models.TextField()
    tech = models.CharField(max_length=500)
    live_url = models.URLField(max_length=500, blank=True, default='')
    repo_url = models.URLField(max_length=500, blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ['sort_order', 'title']

    def __str__(self) -> str:
        return self.title
