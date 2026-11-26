from django.conf import settings
from rest_framework import serializers

from contact.models import Contact
from utils.turnstile import get_client_ip, verify_turnstile


class ContactSerializer(serializers.ModelSerializer):
    turnstile_token = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default='',
    )

    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'message', 'turnstile_token']

    def validate(self, attrs: dict) -> dict:
        token = (attrs.get('turnstile_token') or '').strip()
        if settings.TURNSTILE_TEST_MODE and not token:
            attrs['turnstile_token'] = 'test-mode'
            return attrs
        request = self.context.get('request')
        if not verify_turnstile(token, get_client_ip(request)):
            raise serializers.ValidationError(
                {'turnstile_token': 'Turnstile verification failed'}
            )
        return attrs

    def create(self, validated_data: dict) -> Contact:
        validated_data.pop('turnstile_token', None)
        return super().create(validated_data)
