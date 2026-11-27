from django.conf import settings
from django.db.models import Count, OuterRef, Q, Subquery
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Category, Courses, LearningPath, Project
from courses.serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseSerializer,
    LearningPathDetailSerializer,
    LearningPathListSerializer,
    ProjectSerializer,
)
from utils.courses import get_course_by_slug, list_courses
from utils.learning import serializer_learning_context
from utils.og_course import render_course_og, render_default_og


class ConfigAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # In test mode the widget is skipped; never expose a broken sitekey.
        site_key = ''
        if not getattr(settings, 'TURNSTILE_TEST_MODE', False):
            site_key = settings.TURNSTILE_SITE_KEY or ''
        published_courses = Courses.objects.filter(
            status=Courses.STATUS_PUBLISHED,
        ).count()
        category_count = Category.objects.count()
        return Response(
            {
                'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
                'google_client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'turnstile_site_key': site_key,
                'fiverr_profile_url': settings.FIVERR_PROFILE_URL,
                'published_course_count': published_courses,
                'category_count': category_count,
            }
        )


class CourseListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = list_courses(
            search=request.query_params.get('search'),
            category=request.query_params.get('category'),
            creator=request.query_params.get('creator'),
            level=request.query_params.get('level'),
            language=request.query_params.get('language'),
        )
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        context = {
            'request': request,
            **serializer_learning_context(request.user),
        }
        data = CourseSerializer(page, many=True, context=context).data
        return paginator.get_paginated_response(data)


class CourseDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        course = get_course_by_slug(slug, user=request.user)
        context = {
            'request': request,
            **serializer_learning_context(request.user, course=course),
        }
        return Response(CourseDetailSerializer(course, context=context).data)


def _categories():
    cover = (
        Courses.objects.filter(
            category_id=OuterRef('pk'),
            status=Courses.STATUS_PUBLISHED,
        )
        .exclude(thumbnail_url='')
        .order_by('sort_order', 'id')
        .values('thumbnail_url')[:1]
    )
    return Category.objects.annotate(
        published_course_count=Count(
            'courses',
            filter=Q(courses__status=Courses.STATUS_PUBLISHED),
        ),
        cover_image_url=Subquery(cover),
    )


class CategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(CategorySerializer(_categories(), many=True).data)


class CategoryDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        category = get_object_or_404(_categories(), slug=slug)
        courses = list_courses(category=slug)
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(courses, request, view=self)
        context = {
            'request': request,
            **serializer_learning_context(request.user),
        }
        payload = paginator.get_paginated_response(
            CourseSerializer(page, many=True, context=context).data
        ).data
        payload['category'] = CategorySerializer(category).data
        return Response(payload)


def _published_paths():
    return (
        LearningPath.objects.filter(is_published=True)
        .prefetch_related(
            'steps__course__category',
            'steps__course__creator',
        )
        .order_by('sort_order', 'title')
    )


class LearningPathListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        paths = _published_paths()
        context = {
            'request': request,
            **serializer_learning_context(request.user),
        }
        return Response(
            LearningPathListSerializer(paths, many=True, context=context).data
        )


class LearningPathDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        path = get_object_or_404(_published_paths(), slug=slug)
        context = {
            'request': request,
            **serializer_learning_context(request.user),
        }
        return Response(
            LearningPathDetailSerializer(path, context=context).data
        )


class ProjectListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rows = Project.objects.filter(is_published=True).order_by(
            'sort_order', 'title'
        )
        return Response(ProjectSerializer(rows, many=True).data)


class CourseOGImageAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        course = Courses.objects.filter(
            slug=slug,
            status=Courses.STATUS_PUBLISHED,
        ).first()
        if course is None:
            return HttpResponse(status=404)
        png = render_course_og(course)
        response = HttpResponse(png, content_type='image/png')
        response['Cache-Control'] = 'public, max-age=86400'
        return response


class DefaultOGImageAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        png = render_default_og()
        response = HttpResponse(png, content_type='image/png')
        response['Cache-Control'] = 'public, max-age=86400'
        return response
