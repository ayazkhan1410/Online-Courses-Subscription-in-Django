from django.contrib import admin

from courses.models import CourseModule, Courses


@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    list_display = [
        'courses_name',
        'is_premium',
        'course_image',
        'slug',
    ]
    ordering = ['courses_name']


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = [
        'module_name',
        'course',
        'can_view',
    ]
    ordering = ['module_name']
