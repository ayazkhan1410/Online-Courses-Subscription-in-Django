from rest_framework import serializers

from courses.serializers import CourseSerializer
from learning.models import Enrollment, LessonProgress, WishlistItem


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
