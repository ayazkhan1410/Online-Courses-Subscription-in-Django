from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0006_playlist_suggestion'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursemodule',
            name='is_available',
            field=models.BooleanField(default=True),
        ),
    ]