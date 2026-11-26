from ckeditor.fields import RichTextField
from django.db import models
from django.utils.text import slugify
from embed_video.fields import EmbedVideoField


class Courses(models.Model):
    courses_name = models.CharField(max_length=100)
    courses_description = RichTextField()
    is_premium = models.BooleanField(default=False)
    course_image = models.ImageField(upload_to='courses')
    slug = models.SlugField(blank=True, unique=True)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.courses_name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.courses_name


class CourseModule(models.Model):
    course = models.ForeignKey(
        Courses,
        on_delete=models.CASCADE,
        related_name='course_modules',
    )
    module_name = models.CharField(max_length=100)
    module_description = RichTextField()
    module_video = EmbedVideoField(max_length=500)
    can_view = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.module_name
