from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def mark_existing_users_verified(apps, schema_editor):
    User = apps.get_model('accounts', 'CustomUser')
    User.objects.all().update(email_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_remove_profile_confirm_password_add_google_sub'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='email_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customuser',
            name='mfa_method',
            field=models.CharField(
                blank=True,
                choices=[
                    ('', 'Off'),
                    ('totp', 'Authenticator app'),
                    ('email', 'Email code'),
                ],
                default='',
                max_length=16,
            ),
        ),
        migrations.CreateModel(
            name='EmailVerificationCode',
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
                ('email', models.EmailField(max_length=254)),
                ('code_hash', models.CharField(max_length=64)),
                ('expires_at', models.DateTimeField()),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='email_verification_codes',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.RunPython(
            mark_existing_users_verified,
            migrations.RunPython.noop,
        ),
    ]