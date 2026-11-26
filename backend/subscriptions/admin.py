from django.contrib import admin

from subscriptions.models import Subscription, SubscriptionList


@admin.register(SubscriptionList)
class SubscriptionListAdmin(admin.ModelAdmin):
    list_display = ['subscription_list', 'subscription_price']
    ordering = ['subscription_price']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_pro', 'subscription_list']
