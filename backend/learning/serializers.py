from rest_framework import serializers

from courses.serializers import CourseSerializer
from learning.models import Completion, Enrollment, LessonNote, LessonProgress, WishlistItem
from utils.completion import finished_month_label, learner_display_name


class LessonProgressInputSerializer(serializers.Serializer):
    completed = serializers.BooleanField(required=False, default=True)


class LessonPositionInputSerializer(serializers.Serializer):
    module_id = serializers.IntegerField(min_value=1)
    seconds = serializers.IntegerField(min_value=0)


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'enrolled_at', 'last_accessed_at']


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = [
            'id',
            'module',
            'completed',
            'position_seconds',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class WishlistSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'course', 'created_at']


class LessonNoteSerializer(serializers.ModelSerializer):
    course_slug = serializers.CharField(
        source='module.course.slug', read_only=True
    )
    course_name = serializers.CharField(
        source='module.course.courses_name', read_only=True
    )
    lesson_name = serializers.CharField(
        source='module.module_name', read_only=True
    )

    class Meta:
        model = LessonNote
        fields = [
            'id',
            'module',
            'seconds',
            'body',
            'created_at',
            'updated_at',
            'course_slug',
            'course_name',
            'lesson_name',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonNoteWriteSerializer(serializers.Serializer):
    seconds = serializers.IntegerField(min_value=0, required=False)
    body = serializers.CharField(max_length=2000)


class CompletionBriefSerializer(serializers.ModelSerializer):
    share_id = serializers.CharField(read_only=True)

    class Meta:
        model = Completion
        fields = ['share_id', 'completed_at']


class CompletionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    lesson_count = serializers.SerializerMethodField()
    learner_name = serializers.SerializerMethodField()
    finished_label = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Completion
        fields = [
            'share_id',
            'completed_at',
            'course',
            'lesson_count',
            'learner_name',
            'finished_label',
            'teacher_name',
        ]

    def get_lesson_count(self, obj: Completion) -> int:
        annotated = getattr(obj, 'lesson_count', None)
        if annotated is not None:
            return int(annotated)
        return obj.course.course_modules.count()

    def get_learner_name(self, obj: Completion) -> str:
        return learner_display_name(obj.user)

    def get_finished_label(self, obj: Completion) -> str:
        return finished_month_label(obj.completed_at)

    def get_teacher_name(self, obj: Completion) -> str:
        creator = obj.course.creator
        if creator is not None:
            return creator.name
        return 'Study with Ayaz'


class CompletionPublicSerializer(CompletionSerializer):
    """Public card payload; same fields, no auth required."""
