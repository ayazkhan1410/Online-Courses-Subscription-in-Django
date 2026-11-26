from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.serializers import CourseDetailSerializer, CourseSerializer
from utils.courses import get_course_by_slug, list_courses
from utils.learning import serializer_learning_context


class CourseListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = list_courses(search=request.query_params.get('search'))
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        context = {'request': request, **serializer_learning_context(request.user)}
        data = CourseSerializer(page, many=True, context=context).data
        return paginator.get_paginated_response(data)


class CourseDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        course = get_course_by_slug(slug)
        context = {
            'request': request,
            **serializer_learning_context(request.user, course=course),
        }
        return Response(CourseDetailSerializer(course, context=context).data)
