from django.conf import settings
from rest_framework import serializers

from courses.models import Courses, PlaylistSuggestion
from courses.services.playlist_import import (
    PlaylistImportError,
    playlist_id_from_url,
)


class PlaylistSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaylistSuggestion
        fields = ['id', 'url', 'note', 'email']

    def validate_url(self, value: str) -> str:
        url = (value or '').strip()
        try:
            playlist_id = playlist_id_from_url(url)
        except PlaylistImportError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        existing = Courses.objects.filter(
            youtube_playlist_id=playlist_id,
        ).first()
        if existing is not None:
            if existing.status == Courses.STATUS_PUBLISHED:
                course_url = (
                    f'{settings.FRONTEND_URL.rstrip("/")}/courses/'
                    f'{existing.slug}'
                )
                raise serializers.ValidationError(
                    {
                        'detail': (
                            f'"{existing.courses_name}" is already '
                            'in the catalog.'
                        ),
                        'course_slug': existing.slug,
                        'course_url': course_url,
                    }
                )
            raise serializers.ValidationError(
                'This playlist is already in our catalog (under review).'
            )
        return url

    def validate_note(self, value: str) -> str:
        note = (value or '').strip()
        if not note:
            raise serializers.ValidationError('Tell us why it fits here.')
        if len(note) > 500:
            raise serializers.ValidationError(
                'Use 500 characters or fewer.'
            )
        return note

    def create(self, validated_data: dict) -> PlaylistSuggestion:
        request = self.context.get('request')
        user = None
        if request is not None and getattr(
            request.user, 'is_authenticated', False
        ):
            user = request.user
        email = (validated_data.get('email') or '').strip()
        if user is not None and not email and user.email:
            email = user.email
        return PlaylistSuggestion.objects.create(
            url=validated_data['url'],
            note=validated_data['note'],
            email=email,
            user=user,
        )