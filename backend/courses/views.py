from django.conf import settings
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Category, Courses
from courses.serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseSerializer,
)
from utils.courses import get_course_by_slug, list_courses
from utils.learning import serializer_learning_context


class ConfigAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
                'google_client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'turnstile_site_key': settings.TURNSTILE_SITE_KEY,
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
        context = {'request': request, **serializer_learning_context(request.user)}
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
    return Category.objects.annotate(
        published_course_count=Count(
            'courses',
            filter=Q(courses__status=Courses.STATUS_PUBLISHED),
        )
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
        context = {'request': request, **serializer_learning_context(request.user)}
        payload = paginator.get_paginated_response(
            CourseSerializer(page, many=True, context=context).data
        ).data
        payload['category'] = CategorySerializer(category).data
        return Response(payload)
