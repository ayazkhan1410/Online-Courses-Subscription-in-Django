from django.contrib.sitemaps.views import sitemap
from django.urls import path, re_path

from seo.sitemaps import SITEMAP_CONFIG
from seo.views import SpaMetaView, robots_txt, seo_head

# Back-compat alias for tests/imports.
sitemap_config = SITEMAP_CONFIG

urlpatterns = [
    path('robots.txt', robots_txt, name='robots-txt'),
    path(
        'sitemap.xml',
        sitemap,
        {'sitemaps': SITEMAP_CONFIG},
        name='sitemap',
    ),
    path('api/seo/head/', seo_head, name='seo-head'),
    re_path(r'^$', SpaMetaView.as_view(), name='spa-home'),
    re_path(r'^about/?$', SpaMetaView.as_view(), name='spa-about'),
    re_path(r'^contact/?$', SpaMetaView.as_view(), name='spa-contact'),
    re_path(r'^courses/?$', SpaMetaView.as_view(), name='spa-courses'),
    re_path(
        r'^courses/(?P<slug>[-\w]+)/?$',
        SpaMetaView.as_view(),
        name='spa-course-detail',
    ),
    re_path(r'^categories/?$', SpaMetaView.as_view(), name='spa-categories'),
    re_path(
        r'^categories/(?P<slug>[-\w]+)/?$',
        SpaMetaView.as_view(),
        name='spa-category-detail',
    ),
    re_path(r'^paths/?$', SpaMetaView.as_view(), name='spa-paths'),
    re_path(
        r'^paths/(?P<slug>[-\w]+)/?$',
        SpaMetaView.as_view(),
        name='spa-path-detail',
    ),
    re_path(r'^services/?$', SpaMetaView.as_view(), name='spa-services'),
    re_path(r'^faq/?$', SpaMetaView.as_view(), name='spa-faq'),
    re_path(r'^privacy/?$', SpaMetaView.as_view(), name='spa-privacy'),
    re_path(r'^terms/?$', SpaMetaView.as_view(), name='spa-terms'),
    re_path(
        r'^done/(?P<share_id>[a-z0-9]{10})/?$',
        SpaMetaView.as_view(),
        name='spa-done',
    ),
]
