from django.contrib.sitemaps import Sitemap

from courses.models import Category, Courses, LearningPath


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
