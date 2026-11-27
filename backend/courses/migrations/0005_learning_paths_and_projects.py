from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0004_curated_catalog'),
    ]

    operations = [
        migrations.CreateModel(
            name='LearningPath',
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
                ('title', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=255, unique=True)),
                ('summary', models.TextField()),
                ('level', models.CharField(max_length=64)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('is_published', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['sort_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='Project',
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
                ('title', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=255, unique=True)),
                ('summary', models.TextField()),
                ('tech', models.CharField(max_length=500)),
                ('live_url', models.URLField(blank=True, default='', max_length=500)),
                ('repo_url', models.URLField(blank=True, default='', max_length=500)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('is_published', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['sort_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='PathStep',
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
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('note', models.TextField(blank=True, default='')),
                (
                    'course',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='path_steps',
                        to='courses.courses',
                    ),
                ),
                (
                    'path',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='steps',
                        to='courses.learningpath',
                    ),
                ),
            ],
            options={
                'ordering': ['sort_order', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='pathstep',
            constraint=models.UniqueConstraint(
                fields=('path', 'course'),
                name='uniq_path_step_course',
            ),
        ),
        migrations.AddConstraint(
            model_name='pathstep',
            constraint=models.UniqueConstraint(
                fields=('path', 'sort_order'),
                name='uniq_path_step_order',
            ),
        ),
    ]