"""
URL configuration for the courses API project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('seo.urls')),
    path('api/', include('accounts.urls')),
    path('api/', include('mfa.urls')),
    path('api/', include('courses.urls')),
    path('api/', include('contact.urls')),
    path('api/', include('learning.urls')),
    # Serve uploads under gunicorn (static() helper is DEBUG-only).
    re_path(
        r'^media/(?P<path>.*)$',
        serve,
        {'document_root': settings.MEDIA_ROOT},
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT,
    )
