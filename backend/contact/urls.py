from django.urls import path

from contact import views

urlpatterns = [
    path('contact/', views.ContactCreateAPIView.as_view(), name='contact'),
]
