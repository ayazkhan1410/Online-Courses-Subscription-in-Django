from django.urls import path

from mfa import views

urlpatterns = [
    path('auth/mfa/verify/', views.MfaVerifyAPIView.as_view(), name='mfa-verify'),
    path('auth/mfa/resend/', views.MfaResendAPIView.as_view(), name='mfa-resend'),
    path('auth/mfa/setup/', views.MfaSetupAPIView.as_view(), name='mfa-setup'),
    path('auth/mfa/confirm/', views.MfaConfirmAPIView.as_view(), name='mfa-confirm'),
    path('auth/mfa/disable/', views.MfaDisableAPIView.as_view(), name='mfa-disable'),
    path('auth/mfa/status/', views.MfaStatusAPIView.as_view(), name='mfa-status'),
]
