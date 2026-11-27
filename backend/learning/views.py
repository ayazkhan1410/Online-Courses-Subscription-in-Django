from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Courses
from learning.models import LessonNote
from learning.serializers import (
    EnrollmentSerializer,
    LessonNoteSerializer,
    LessonNoteWriteSerializer,
    LessonPositionInputSerializer,
    LessonProgressInputSerializer,
    LessonProgressSerializer,
    WishlistSerializer,
)
from utils.learning import (
    add_wishlist,
    build_dashboard,
    create_lesson_note,
    delete_lesson_note,
    enroll_user,
    list_all_notes,
    list_enrollments,
    list_lesson_notes,
    list_wishlist,
    mark_lesson_progress,
    remove_wishlist,
    save_lesson_position,
    update_lesson_note,
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


class LessonPositionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'progress_position'

    def post(self, request):
        payload = LessonPositionInputSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            progress = save_lesson_position(
                request.user,
                payload.validated_data['module_id'],
                payload.validated_data['seconds'],
            )
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN
            )
        return Response(LessonProgressSerializer(progress).data)


class ModuleNotesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, module_id: int):
        try:
            notes = list_lesson_notes(request.user, module_id)
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN
            )
        return Response(LessonNoteSerializer(notes, many=True).data)

    def post(self, request, module_id: int):
        payload = LessonNoteWriteSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            note = create_lesson_note(
                request.user,
                module_id,
                payload.validated_data['body'],
                payload.validated_data.get('seconds', 0),
            )
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN
            )
        return Response(
            LessonNoteSerializer(note).data,
            status=status.HTTP_201_CREATED,
        )


class NoteDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, note_id: int):
        payload = LessonNoteWriteSerializer(data=request.data, partial=True)
        payload.is_valid(raise_exception=True)
        try:
            note = update_lesson_note(
                request.user,
                note_id,
                body=payload.validated_data.get('body'),
                seconds=payload.validated_data.get('seconds'),
            )
        except LessonNote.DoesNotExist:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(LessonNoteSerializer(note).data)

    def delete(self, request, note_id: int):
        try:
            delete_lesson_note(request.user, note_id)
        except LessonNote.DoesNotExist:
            return Response(
                {'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AllNotesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            LessonNoteSerializer(list_all_notes(request.user), many=True).data
        )


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
