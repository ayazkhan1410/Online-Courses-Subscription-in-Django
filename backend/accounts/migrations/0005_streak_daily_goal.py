from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_show_name_on_completion'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='daily_goal',
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='customuser',
            name='timezone',
            field=models.CharField(
                default='Asia/Karachi',
                max_length=64,
            ),
        ),
    ]