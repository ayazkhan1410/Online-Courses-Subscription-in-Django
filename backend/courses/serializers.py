from rest_framework import serializers

from courses.models import CourseModule, Courses
from learning.models import Enrollment, LessonProgress, WishlistItem


class CourseModuleSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = CourseModule
        fields = [
            'id',
            'module_name',
            'module_description',
            'module_video',
            'embed_url',
            'youtube_video_id',
            'thumbnail_url',
            'sort_order',
            'can_view',
            'is_completed',
        ]

    def get_embed_url(self, obj: CourseModule) -> str | None:
        video_id = (obj.youtube_video_id or '').strip()
        if video_id:
            return f'https://www.youtube.com/embed/{video_id}'
        url = (obj.module_video or '').strip()
        if 'youtube.com/embed/' in url:
            return url
        if 'watch?v=' in url:
            vid = url.split('watch?v=', 1)[1].split('&', 1)[0]
            if vid:
                return f'https://www.youtube.com/embed/{vid}'
        if 'youtu.be/' in url:
            vid = url.rstrip('/').split('/')[-1].split('?', 1)[0]
            if vid:
                return f'https://www.youtube.com/embed/{vid}'
        return url or None

    def get_is_completed(self, obj: CourseModule) -> bool:
        completed_ids = self.context.get('completed_module_ids')
        if completed_ids is not None:
            return obj.id in completed_ids
        request = self.context.get('request')
        if request is None or not getattr(request.user, 'is_authenticated', False):
            return False
        return LessonProgress.objects.filter(
            user=request.user,
            module=obj,
            completed=True,
        ).exists()


class CourseSerializer(serializers.ModelSerializer):
    course_image = serializers.SerializerMethodField()
    module_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Courses
        fields = [
            'id',
            'courses_name',
            'courses_description',
            'is_premium',
            'course_image',
            'thumbnail_url',
            'playlist_url',
            'youtube_playlist_id',
            'slug',
            'module_count',
            'is_enrolled',
            'is_wishlisted',
            'progress_percent',
        ]

    def get_course_image(self, obj: Courses) -> str | None:
        if obj.thumbnail_url:
            return obj.thumbnail_url
        if not obj.course_image:
            return None
        request = self.context.get('request')
        url = obj.course_image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_module_count(self, obj: Courses) -> int:
        annotated = getattr(obj, 'module_count', None)
        if annotated is not None:
            return int(annotated)
        return obj.course_modules.count()

    def _user(self):
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return None
        return request.user

    def get_is_enrolled(self, obj: Courses) -> bool:
        user = self._user()
        if user is None:
            return False
        enrolled_ids = self.context.get('enrolled_ids')
        if enrolled_ids is not None:
            return obj.id in enrolled_ids
        return Enrollment.objects.filter(user=user, course=obj).exists()

    def get_is_wishlisted(self, obj: Courses) -> bool:
        user = self._user()
        if user is None:
            return False
        wish_ids = self.context.get('wishlist_ids')
        if wish_ids is not None:
            return obj.id in wish_ids
        return WishlistItem.objects.filter(user=user, course=obj).exists()

    def get_progress_percent(self, obj: Courses) -> int:
        user = self._user()
        if user is None:
            return 0
        progress_map = self.context.get('progress_map')
        if progress_map is not None:
            return int(progress_map.get(obj.id, 0))
        total = obj.course_modules.count()
        if total == 0:
            return 0
        done = LessonProgress.objects.filter(
            user=user,
            module__course=obj,
            completed=True,
        ).count()
        return int(round(100 * done / total))


class CourseDetailSerializer(CourseSerializer):
    course_modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['course_modules']
