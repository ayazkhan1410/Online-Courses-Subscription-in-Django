from django.urls import path

from learning import views

urlpatterns = [
    path('dashboard/', views.DashboardAPIView.as_view(), name='dashboard'),
    path(
        'enrollments/',
        views.EnrollmentListAPIView.as_view(),
        name='enrollments',
    ),
    path(
        'courses/<slug:slug>/enroll/',
        views.EnrollCourseAPIView.as_view(),
        name='course-enroll',
    ),
    path(
        'modules/<int:module_id>/progress/',
        views.LessonProgressAPIView.as_view(),
        name='module-progress',
    ),
    path(
        'learning/progress/position/',
        views.LessonPositionAPIView.as_view(),
        name='lesson-position',
    ),
    path(
        'wishlist/', views.WishlistListCreateAPIView.as_view(), name='wishlist'
    ),
    path(
        'wishlist/<slug:slug>/',
        views.WishlistDeleteAPIView.as_view(),
        name='wishlist-delete',
    ),
]
