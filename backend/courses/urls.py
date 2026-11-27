from django.urls import path, re_path

from courses import views
from courses.views_suggest import PlaylistSuggestionCreateAPIView

urlpatterns = [
    path('config/', views.ConfigAPIView.as_view(), name='config'),
    path(
        'categories/',
        views.CategoryListAPIView.as_view(),
        name='category-list',
    ),
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
    path('paths/', views.LearningPathListAPIView.as_view(), name='path-list'),
    path(
        'paths/<slug:slug>/',
        views.LearningPathDetailAPIView.as_view(),
        name='path-detail',
    ),
    path('projects/', views.ProjectListAPIView.as_view(), name='project-list'),
    path(
        'playlist-suggestions/',
        PlaylistSuggestionCreateAPIView.as_view(),
        name='playlist-suggestion-create',
    ),
]
