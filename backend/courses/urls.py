from django.urls import path

from courses import views

urlpatterns = [
    path('courses/', views.CourseListAPIView.as_view(), name='course-list'),
    path(
        'courses/<slug:slug>/',
        views.CourseDetailAPIView.as_view(),
        name='course-detail',
    ),
]
