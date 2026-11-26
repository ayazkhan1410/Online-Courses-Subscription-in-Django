from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path

from courses.models import Category, CourseModule, Courses, Creator
from courses.services.playlist_import import PlaylistImportError, import_playlist


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
        'playlist_url',
        'youtube_playlist_id',
        'creator__name',
        'creator__channel_url',
    ]
    ordering = ['sort_order', 'courses_name']
    actions = ['publish_courses', 'hide_courses', 'import_playlist_by_url']

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
                    messages.success(request, f'Imported {course.courses_name}.')
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


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = [
        'module_name',
        'course',
        'sort_order',
        'duration_seconds',
        'can_view',
    ]
    list_filter = ['can_view', 'course']
    search_fields = ['module_name', 'youtube_video_id']
    ordering = ['course', 'sort_order']
