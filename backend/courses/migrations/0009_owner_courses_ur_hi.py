from django.db import migrations


def set_owner_language_ur_hi(apps, schema_editor):
    Courses = apps.get_model('courses', 'Courses')
    Courses.objects.filter(creator__is_owner=True).update(language='ur-hi')


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0008_coursemodule_practice_fields'),
    ]

    operations = [
        migrations.RunPython(set_owner_language_ur_hi, noop_reverse),
    ]
