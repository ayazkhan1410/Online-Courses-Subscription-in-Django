from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Courses
from learning.serializers import (
    EnrollmentSerializer,
    LessonProgressInputSerializer,
    LessonProgressSerializer,
    WishlistSerializer,
)
from utils.learning import (
    add_wishlist,
    build_dashboard,
    enroll_user,
    list_enrollments,
    list_wishlist,
    mark_lesson_progress,
    remove_wishlist,
)


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard(request.user))


class EnrollCourseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug: str):
        course = Courses.objects.filter(slug=slug).first()
        if course is None:
            return Response(
                {'detail': 'Not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            enrollment = enroll_user(request.user, course)
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN
            )
        return Response(
            EnrollmentSerializer(
                enrollment,
                context={'request': request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class EnrollmentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = list_enrollments(request.user)
        return Response(
            EnrollmentSerializer(
                qs, many=True, context={'request': request}
            ).data
        )


class LessonProgressAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, module_id: int):
        payload = LessonProgressInputSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            progress = mark_lesson_progress(
                request.user,
                module_id,
                completed=payload.validated_data.get('completed', True),
            )
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN
            )
        return Response(LessonProgressSerializer(progress).data)


class WishlistListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            WishlistSerializer(
                list_wishlist(request.user),
                many=True,
                context={'request': request},
            ).data
        )

    def post(self, request):
        slug = request.data.get('slug')
        if not slug:
            return Response(
                {'detail': 'slug is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item, created = add_wishlist(request.user, slug)
        return Response(
            WishlistSerializer(item, context={'request': request}).data,
            status=(
                status.HTTP_201_CREATED if created else status.HTTP_200_OK
            ),
        )


class WishlistDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug: str):
        remove_wishlist(request.user, slug)
        return Response(status=status.HTTP_204_NO_CONTENT)
