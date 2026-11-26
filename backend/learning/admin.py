from django.contrib import admin

from learning.models import Enrollment, LessonProgress, WishlistItem


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'enrolled_at', 'last_accessed_at']
    search_fields = ['user__email', 'course__courses_name']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'completed', 'updated_at']
    list_filter = ['completed']


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'created_at']
