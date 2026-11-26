from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(name='Profile'),
        migrations.RemoveField(
            model_name='customuser',
            name='confirm_password',
        ),
        migrations.AddField(
            model_name='customuser',
            name='google_sub',
            field=models.CharField(
                blank=True,
                max_length=255,
                null=True,
                unique=True,
            ),
        ),
    ]
