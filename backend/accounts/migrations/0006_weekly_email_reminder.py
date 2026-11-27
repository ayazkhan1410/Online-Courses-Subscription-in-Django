import secrets

from django.db import migrations, models


def backfill_unsubscribe_tokens(apps, schema_editor):
    User = apps.get_model('accounts', 'CustomUser')
    for user in User.objects.filter(unsubscribe_token__isnull=True):
        for _ in range(12):
            candidate = secrets.token_urlsafe(32)
            if not User.objects.filter(unsubscribe_token=candidate).exists():
                user.unsubscribe_token = candidate
                user.save(update_fields=['unsubscribe_token'])
                break


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_streak_daily_goal'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='last_reminder_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='unsubscribe_token',
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=64,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='customuser',
            name='weekly_email',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            backfill_unsubscribe_tokens,
            migrations.RunPython.noop,
        ),
    ]