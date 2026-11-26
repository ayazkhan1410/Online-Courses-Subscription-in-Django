from django.contrib import admin

from accounts.models import CustomUser, Profile


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = [
        'full_name',
        'email',
        'user_choices',
        'is_staff',
    ]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'forget_token']
