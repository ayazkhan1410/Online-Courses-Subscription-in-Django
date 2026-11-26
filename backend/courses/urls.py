from django.urls import path

from courses import views

urlpatterns = [
    path('config/', views.ConfigAPIView.as_view(), name='config'),
    path('categories/', views.CategoryListAPIView.as_view(), name='category-list'),
    path(
        'categories/<slug:slug>/',
        views.CategoryDetailAPIView.as_view(),
        name='category-detail',
    ),
    path('courses/', views.CourseListAPIView.as_view(), name='course-list'),
    path(
        'courses/<slug:slug>/',
        views.CourseDetailAPIView.as_view(),
        name='course-detail',
    ),
]
