from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0007_coursemodule_is_available'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursemodule',
            name='practice_hint',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='coursemodule',
            name='practice_task',
            field=models.TextField(blank=True, default=''),
        ),
    ]