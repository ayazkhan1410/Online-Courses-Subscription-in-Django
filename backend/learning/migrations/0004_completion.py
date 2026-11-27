import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_learning_paths_and_projects'),
        ('learning', '0003_lesson_notes'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Completion',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'completed_at',
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                (
                    'share_id',
                    models.CharField(db_index=True, max_length=10, unique=True),
                ),
                (
                    'course',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='completions',
                        to='courses.courses',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='completions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-completed_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='completion',
            constraint=models.UniqueConstraint(
                fields=('user', 'course'),
                name='uniq_user_course_completion',
            ),
        ),
    ]