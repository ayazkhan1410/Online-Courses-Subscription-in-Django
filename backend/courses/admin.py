from django import forms
from django.conf import settings
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path

from courses.models import (
    Category,
    CourseModule,
    Courses,
    Creator,
    LearningPath,
    PathStep,
    PlaylistSuggestion,
    Project,
)
from courses.services.playlist_import import (
    PlaylistImportError,
    import_playlist,
)
from courses.services.playlist_sync import (
    PlaylistSyncError,
    sync_course_playlist,
)


class ImportPlaylistForm(forms.Form):
    playlist_url = forms.URLField(label='Playlist URL')
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        required=False,
    )
    level = forms.ChoiceField(
        choices=Courses.LEVEL_CHOICES, initial=Courses.LEVEL_BEGINNER
    )
    language = forms.ChoiceField(
        choices=Courses.LANGUAGE_CHOICES,
        initial=Courses.LANGUAGE_EN,
    )
    publish = forms.BooleanField(required=False, label='Publish immediately')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'sort_order', 'is_featured']
    list_filter = ['is_featured']
    search_fields = ['name', 'slug']
    ordering = ['sort_order', 'name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Creator)
class CreatorAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_owner', 'youtube_channel_id']
    list_filter = ['is_owner']
    search_fields = ['name', 'slug', 'youtube_channel_id', 'channel_url']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    change_list_template = 'admin/courses_changelist.html'
    list_display = [
        'courses_name',
        'status',
        'category',
        'creator',
        'level',
        'language',
        'slug',
    ]
    list_filter = ['category', 'creator', 'status', 'level', 'language']
    search_fields = [
        'courses_name',
        'slug',
        'playlist_url',
        'youtube_playlist_id',
        'creator__name',
        'creator__channel_url',
    ]
    ordering = ['sort_order', 'courses_name']
    actions = [
        'publish_courses',
        'hide_courses',
        'import_playlist_by_url',
        'sync_playlists_now',
    ]

    @admin.action(description='Publish selected courses')
    def publish_courses(self, request, queryset):
        updated = queryset.update(status=Courses.STATUS_PUBLISHED)
        self.message_user(request, f'{updated} course(s) published.')

    @admin.action(description='Hide selected courses')
    def hide_courses(self, request, queryset):
        updated = queryset.update(status=Courses.STATUS_HIDDEN)
        self.message_user(request, f'{updated} course(s) hidden.')

    @admin.action(description='Import playlist by URL')
    def import_playlist_by_url(self, request, queryset):
        return redirect('admin:courses_courses_import_playlist')

    @admin.action(description='Sync now')
    def sync_playlists_now(self, request, queryset):
        api_key = getattr(settings, 'YOUTUBE_API_KEY', '')
        if not (api_key or '').strip():
            self.message_user(
                request,
                'YOUTUBE_API_KEY is not set; sync skipped.',
                level=messages.WARNING,
            )
            return
        synced = 0
        for course in queryset:
            if not (course.youtube_playlist_id or '').strip():
                continue
            try:
                stats = sync_course_playlist(course, api_key.strip())
            except PlaylistSyncError as exc:
                self.message_user(
                    request,
                    f'{course.courses_name}: {exc}',
                    level=messages.ERROR,
                )
                continue
            synced += 1
            self.message_user(
                request,
                (
                    f'{course.courses_name}: added {stats.get("added", 0)}, '
                    f'hidden {stats.get("hidden", 0)}.'
                ),
            )
        if not synced:
            self.message_user(
                request,
                'No playlists were synced.',
                level=messages.WARNING,
            )

    def changelist_view(self, request, extra_context=None):
        if (
            request.method == 'POST'
            and request.POST.get('action') == 'import_playlist_by_url'
        ):
            return redirect('admin:courses_courses_import_playlist')
        return super().changelist_view(request, extra_context)

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                'import-playlist/',
                self.admin_site.admin_view(self.import_playlist_view),
                name='courses_courses_import_playlist',
            ),
        ]
        return custom + urls

    def import_playlist_view(self, request):
        if request.method == 'POST':
            form = ImportPlaylistForm(request.POST)
            if form.is_valid():
                try:
                    course = import_playlist(
                        form.cleaned_data['playlist_url'],
                        category=form.cleaned_data['category'],
                        level=form.cleaned_data['level'],
                        language=form.cleaned_data['language'],
                        publish=form.cleaned_data['publish'],
                    )
                except PlaylistImportError as exc:
                    messages.error(request, str(exc))
                else:
                    messages.success(
                        request, f'Imported {course.courses_name}.'
                    )
                    return redirect('admin:courses_courses_change', course.pk)
        else:
            form = ImportPlaylistForm()
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'form': form,
            'title': 'Import playlist by URL',
        }
        return TemplateResponse(request, 'admin/import_playlist.html', context)


class PathStepInline(admin.TabularInline):
    model = PathStep
    extra = 0
    ordering = ['sort_order']
    autocomplete_fields = ['course']


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'level', 'sort_order', 'is_published']
    list_filter = ['is_published', 'level']
    search_fields = ['title', 'slug', 'summary']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['sort_order', 'title']
    inlines = [PathStepInline]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'sort_order', 'is_published']
    list_filter = ['is_published']
    search_fields = ['title', 'slug', 'summary', 'tech']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['sort_order', 'title']


@admin.register(PlaylistSuggestion)
class PlaylistSuggestionAdmin(admin.ModelAdmin):
    list_display = ['url', 'email', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['url', 'email', 'note', 'user__email']
    readonly_fields = ['created_at']
    actions = ['import_suggestions']

    @admin.action(description='Import')
    def import_suggestions(self, request, queryset):
        done = 0
        errors = 0
        for row in queryset:
            try:
                import_playlist(row.url)
            except PlaylistImportError as exc:
                errors += 1
                self.message_user(
                    request,
                    f'Could not import {row.url}: {exc}',
                    level=messages.ERROR,
                )
                continue
            row.status = PlaylistSuggestion.STATUS_ADDED
            row.save(update_fields=['status'])
            done += 1
        if done:
            self.message_user(request, f'Imported {done} playlist(s).')
        if errors and not done:
            self.message_user(
                request,
                'No playlists were imported.',
                level=messages.WARNING,
            )


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = [
        'module_name',
        'course',
        'sort_order',
        'duration_seconds',
        'can_view',
        'is_available',
    ]
    list_filter = ['can_view', 'is_available', 'course']
    search_fields = ['module_name', 'youtube_video_id']
    ordering = ['course', 'sort_order']
