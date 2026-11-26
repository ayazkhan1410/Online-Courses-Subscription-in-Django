from django.contrib import admin

from accounts.models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = [
        'full_name',
        'email',
        'user_choices',
        'is_staff',
        'google_sub',
    ]
    search_fields = ['email', 'full_name', 'username']
