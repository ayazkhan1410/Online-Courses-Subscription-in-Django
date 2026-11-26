from django.urls import path

from study import views

urlpatterns = [
    path('courses/', views.CourseListAPIView.as_view(), name='course-list'),
    path(
        'courses/<slug:slug>/',
        views.CourseDetailAPIView.as_view(),
        name='course-detail',
    ),
    path('contact/', views.ContactCreateAPIView.as_view(), name='contact'),
    path('auth/register/', views.RegisterAPIView.as_view(), name='register'),
    path('auth/login/', views.LoginAPIView.as_view(), name='login'),
    path('auth/logout/', views.LogoutAPIView.as_view(), name='logout'),
    path('auth/me/', views.MeAPIView.as_view(), name='me'),
    path(
        'auth/forget-password/',
        views.ForgetPasswordAPIView.as_view(),
        name='forget-password',
    ),
    path(
        'auth/change-password/',
        views.ChangePasswordAPIView.as_view(),
        name='change-password',
    ),
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
    path('config/', views.ConfigAPIView.as_view(), name='config'),
]
