from django.urls import path

from subscriptions import views

urlpatterns = [
    path(
        'subscriptions/',
        views.SubscriptionListAPIView.as_view(),
        name='subscriptions',
    ),
    path(
        'become-pro/',
        views.BecomeProAPIView.as_view(),
        name='become-pro',
    ),
]
