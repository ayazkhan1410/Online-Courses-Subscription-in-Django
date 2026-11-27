from rest_framework import serializers

from courses.models import (
    Category,
    CourseModule,
    Courses,
    Creator,
    LearningPath,
    PathStep,
    Project,
)
from learning.models import Enrollment, LessonProgress, WishlistItem


def _nocookie_embed(video_id: str) -> str:
    return f'https://www.youtube-nocookie.com/embed/{video_id}'


class CategorySerializer(serializers.ModelSerializer):
    published_course_count = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'sort_order',
            'is_featured',
            'published_course_count',
            'cover_image_url',
        ]

    def get_published_course_count(self, obj: Category) -> int:
        annotated = getattr(obj, 'published_course_count', None)
        if annotated is not None:
            return int(annotated)
        return obj.courses.filter(status=Courses.STATUS_PUBLISHED).count()

    def get_cover_image_url(self, obj: Category) -> str:
        annotated = getattr(obj, 'cover_image_url', None)
        if annotated:
            return str(annotated)
        course = (
            obj.courses.filter(status=Courses.STATUS_PUBLISHED)
            .exclude(thumbnail_url='')
            .order_by('sort_order', 'id')
            .only('thumbnail_url')
            .first()
        )
        return course.thumbnail_url if course else ''


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'slug', 'icon']


class CreatorBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = ['name', 'slug', 'avatar_url', 'channel_url', 'is_owner']


class CourseModuleSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    position_seconds = serializers.SerializerMethodField()

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
            'duration_seconds',
            'can_view',
            'is_completed',
            'is_locked',
            'position_seconds',
            'practice_task',
            'practice_hint',
        ]

    def get_embed_url(self, obj: CourseModule) -> str | None:
        video_id = (obj.youtube_video_id or '').strip()
        if video_id:
            return _nocookie_embed(video_id)
        url = (obj.module_video or '').strip()
        if 'youtube.com/embed/' in url or 'youtube-nocookie.com/embed/' in url:
            vid = url.split('/embed/', 1)[1].split('?', 1)[0].split('/', 1)[0]
            return _nocookie_embed(vid) if vid else None
        if 'watch?v=' in url:
            vid = url.split('watch?v=', 1)[1].split('&', 1)[0]
            if vid:
                return _nocookie_embed(vid)
        if 'youtu.be/' in url:
            vid = url.rstrip('/').split('/')[-1].split('?', 1)[0]
            if vid:
                return _nocookie_embed(vid)
        return url or None

    def get_is_completed(self, obj: CourseModule) -> bool:
        completed_ids = self.context.get('completed_module_ids')
        if completed_ids is not None:
            return obj.id in completed_ids
        request = self.context.get('request')
        if request is None or not getattr(
            request.user, 'is_authenticated', False
        ):
            return False
        return LessonProgress.objects.filter(
            user=request.user,
            module=obj,
            completed=True,
        ).exists()

    def get_position_seconds(self, obj: CourseModule) -> int:
        position_map = self.context.get('position_map')
        if position_map is not None:
            return int(position_map.get(obj.id, 0))
        request = self.context.get('request')
        if request is None or not getattr(
            request.user, 'is_authenticated', False
        ):
            return 0
        row = LessonProgress.objects.filter(
            user=request.user,
            module=obj,
        ).only('position_seconds').first()
        return int(row.position_seconds) if row else 0

    def _can_access(self, obj: CourseModule) -> bool:
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if user is None or not user.is_authenticated:
            return False
        enrolled_ids = self.context.get('enrolled_ids')
        if enrolled_ids is not None:
            return obj.course_id in enrolled_ids
        return Enrollment.objects.filter(user=user, course=obj.course).exists()

    def get_is_locked(self, obj: CourseModule) -> bool:
        return not self._can_access(obj)

    def to_representation(self, instance: CourseModule) -> dict:
        data = super().to_representation(instance)
        if data.get('is_locked'):
            data['module_video'] = None
            data['embed_url'] = None
            data['youtube_video_id'] = None
            data['thumbnail_url'] = None
        return data


class CourseSerializer(serializers.ModelSerializer):
    course_image = serializers.SerializerMethodField()
    module_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    category = CategoryBriefSerializer(read_only=True)
    creator = CreatorBriefSerializer(read_only=True)
    attribution = serializers.SerializerMethodField()

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
            'status',
            'level',
            'language',
            'category',
            'creator',
            'attribution',
            'module_count',
            'is_enrolled',
            'is_wishlisted',
            'progress_percent',
        ]

    def get_attribution(self, obj: Courses) -> str:
        creator = obj.creator
        if creator is not None:
            return f'YouTube playlist by {creator.name}'
        if obj.playlist_url:
            return 'YouTube playlist'
        return ''

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
        return obj.course_modules.filter(is_available=True).count()

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
        total = obj.course_modules.filter(is_available=True).count()
        if total == 0:
            return 0
        done = LessonProgress.objects.filter(
            user=user,
            module__course=obj,
            module__is_available=True,
            completed=True,
        ).count()
        return int(round(100 * done / total))


class CourseDetailSerializer(CourseSerializer):
    course_modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['course_modules']


class CourseBriefSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='courses_name')
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Courses
        fields = ['slug', 'title', 'thumbnail']

    def get_thumbnail(self, obj: Courses) -> str:
        if obj.thumbnail_url:
            return obj.thumbnail_url
        if not obj.course_image:
            return ''
        request = self.context.get('request')
        url = obj.course_image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class PathStepListSerializer(serializers.ModelSerializer):
    course = CourseBriefSerializer(read_only=True)

    class Meta:
        model = PathStep
        fields = ['sort_order', 'note', 'course']


class PathStepDetailSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = PathStep
        fields = ['sort_order', 'note', 'course']


class LearningPathListSerializer(serializers.ModelSerializer):
    step_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    steps = PathStepListSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = [
            'title',
            'slug',
            'summary',
            'level',
            'sort_order',
            'step_count',
            'total_count',
            'completed_count',
            'steps',
        ]

    def get_step_count(self, obj: LearningPath) -> int:
        return obj.steps.count()

    def get_total_count(self, obj: LearningPath) -> int:
        return self.get_step_count(obj)

    def get_completed_count(self, obj: LearningPath) -> int | None:
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request is not None else None
        if user is None or not user.is_authenticated:
            return None
        progress_map = self.context.get('progress_map') or {}
        course_ids = [step.course_id for step in obj.steps.all()]
        return sum(1 for cid in course_ids if progress_map.get(cid, 0) >= 100)


class LearningPathDetailSerializer(serializers.ModelSerializer):
    steps = PathStepDetailSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = [
            'title',
            'slug',
            'summary',
            'level',
            'sort_order',
            'steps',
        ]


class ProjectSerializer(serializers.ModelSerializer):
    tech_list = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'title',
            'slug',
            'summary',
            'tech',
            'tech_list',
            'live_url',
            'repo_url',
            'sort_order',
        ]

    def get_tech_list(self, obj: Project) -> list[str]:
        return [part.strip() for part in obj.tech.split(',') if part.strip()]
