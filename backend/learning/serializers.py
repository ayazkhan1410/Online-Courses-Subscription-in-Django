from rest_framework import serializers

from courses.serializers import CourseSerializer
from learning.models import Enrollment, LessonProgress, WishlistItem


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'enrolled_at', 'last_accessed_at']


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ['id', 'module', 'completed', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class WishlistSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'course', 'created_at']
