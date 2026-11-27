from rest_framework import serializers

from mfa.models import LoginChallenge


class MfaVerifySerializer(serializers.Serializer):
    challenge_token = serializers.CharField(max_length=64)
    code = serializers.CharField(max_length=64)
    method = serializers.ChoiceField(choices=LoginChallenge.Method.choices)


class MfaResendSerializer(serializers.Serializer):
    challenge_token = serializers.CharField(max_length=64)


class MfaConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=16)


class MfaDisableSerializer(serializers.Serializer):
    password = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
    )
    code = serializers.CharField(
        required=False, allow_blank=True, max_length=64
    )

    def validate(self, attrs: dict) -> dict:
        if not attrs.get('password') and not attrs.get('code'):
            raise serializers.ValidationError('Password or code is required.')
        return attrs
