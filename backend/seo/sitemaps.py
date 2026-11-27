from urllib.parse import urlsplit

from django.conf import settings
from django.contrib.sitemaps import Sitemap as BaseSitemap

from courses.models import Category, Courses, LearningPath


class Sitemap(BaseSitemap):
    """Public loc host comes from FRONTEND_URL, not the API request host."""

    def get_domain(self, site=None):
        return urlsplit(settings.FRONTEND_URL).netloc

    def get_protocol(self, protocol=None):
        return urlsplit(settings.FRONTEND_URL).scheme or 'https'


class StaticViewSitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return [
            'home',
            'about',
            'courses',
            'categories',
            'paths',
            'services',
            'contact',
            'faq',
            'privacy',
            'terms',
        ]

    def location(self, item: str) -> str:
        if item == 'home':
            return '/'
        return f'/{item}'


class CourseSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Courses.objects.filter(status=Courses.STATUS_PUBLISHED)

    def location(self, obj: Courses) -> str:
        return f'/courses/{obj.slug}'


class CategorySitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        return Category.objects.all()

    def location(self, obj: Category) -> str:
        return f'/categories/{obj.slug}'


class LearningPathSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        return LearningPath.objects.filter(is_published=True)

    def location(self, obj: LearningPath) -> str:
        return f'/paths/{obj.slug}'


SITEMAP_CONFIG = {
    'static': StaticViewSitemap,
    'courses': CourseSitemap,
    'categories': CategorySitemap,
    'paths': LearningPathSitemap,
}
