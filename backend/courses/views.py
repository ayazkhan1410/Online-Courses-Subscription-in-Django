from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from courses.models import Courses
from courses.serializers import CourseDetailSerializer, CourseSerializer


class CourseListAPIView(generics.ListAPIView):
    """List courses with optional search and pagination."""

    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Courses.objects.all().order_by('id')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(courses_name__icontains=search)
                | Q(courses_description__icontains=search)
            )
        return queryset


class CourseDetailAPIView(generics.RetrieveAPIView):
    """Retrieve a single course with its modules."""

    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'
    queryset = Courses.objects.prefetch_related('course_modules').all()
