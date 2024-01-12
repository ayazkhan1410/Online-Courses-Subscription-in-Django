from django.contrib import admin
from .models import (Courses, CourseModule, CustomUser, Contact, Profile,SubscriptionList, Subscription)
# from embed_video.admin import AdminVideoMixin

@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    list_display = ['courses_name', 'courses_description', 'is_premium', 'course_image', 'slug']
    ordering = ['courses_name']

@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ['module_name', 'module_description', 'module_video', 'can_view',]
    ordering = ['module_name']
    
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'password', 'confirm_password', 'user_choices']

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "message"]

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user",
                    "forget_token"
                    ]

@admin.register(SubscriptionList)
class SubscriptionListAdmin(admin.ModelAdmin):
    list_display =[ "subscription_list","subscription_price"]
    ordering = ["subscription_price"]

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user","is_pro","subscription_list"]