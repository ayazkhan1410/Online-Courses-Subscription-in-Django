from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_email_verification_and_mfa_method'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='show_name_on_completion',
            field=models.BooleanField(default=True),
        ),
    ]