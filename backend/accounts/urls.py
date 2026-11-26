from django.urls import path

from accounts import views

urlpatterns = [
    path('auth/register/', views.RegisterAPIView.as_view(), name='register'),
    path('auth/login/', views.LoginAPIView.as_view(), name='login'),
    path('auth/google/', views.GoogleAuthAPIView.as_view(), name='auth-google'),
    path('auth/token/refresh/', views.JwtRefreshAPIView.as_view(), name='token-refresh'),
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
]
