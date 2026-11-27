from django.urls import path, re_path

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
        'modules/<int:module_id>/notes/',
        views.ModuleNotesAPIView.as_view(),
        name='module-notes',
    ),
    path(
        'notes/<int:note_id>/',
        views.NoteDetailAPIView.as_view(),
        name='note-detail',
    ),
    path('notes/', views.AllNotesAPIView.as_view(), name='all-notes'),
    path(
        'wishlist/', views.WishlistListCreateAPIView.as_view(), name='wishlist'
    ),
    path(
        'wishlist/<slug:slug>/',
        views.WishlistDeleteAPIView.as_view(),
        name='wishlist-delete',
    ),
    path(
        'completions/',
        views.CompletionListAPIView.as_view(),
        name='completions',
    ),
    path(
        'completions/<str:share_id>/',
        views.CompletionDetailAPIView.as_view(),
        name='completion-detail',
    ),
    re_path(
        r'^og/done/(?P<share_id>[a-z0-9]{10})\.png$',
        views.CompletionOGImageAPIView.as_view(),
        name='completion-og',
    ),
]
