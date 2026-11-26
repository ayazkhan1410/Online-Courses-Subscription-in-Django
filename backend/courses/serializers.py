from rest_framework import serializers

from courses.models import CourseModule, Courses


class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = [
            'id',
            'module_name',
            'module_description',
            'module_video',
            'can_view',
        ]


class CourseSerializer(serializers.ModelSerializer):
    course_image = serializers.SerializerMethodField()

    class Meta:
        model = Courses
        fields = [
            'id',
            'courses_name',
            'courses_description',
            'is_premium',
            'course_image',
            'slug',
        ]

    def get_course_image(self, obj: Courses) -> str | None:
        if not obj.course_image:
            return None
        request = self.context.get('request')
        url = obj.course_image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class CourseDetailSerializer(CourseSerializer):
    course_modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['course_modules']
