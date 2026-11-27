from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import CustomUser
from subscriptions.models import Subscription
from utils.turnstile import get_client_ip, verify_turnstile


def _require_turnstile(serializer: serializers.Serializer, attrs: dict) -> dict:
    token = (attrs.get('turnstile_token') or '').strip()
    if settings.TURNSTILE_TEST_MODE and not token:
        attrs['turnstile_token'] = 'test-mode'
        return attrs
    request = serializer.context.get('request')
    if not verify_turnstile(token, get_client_ip(request)):
        raise serializers.ValidationError(
            {'turnstile_token': 'Turnstile verification failed'}
        )
    return attrs


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=40)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    turnstile_token = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default='',
    )

    def validate_email(self, value: str) -> str:
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value.lower()

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate(self, attrs: dict) -> dict:
        return _require_turnstile(self, attrs)

    def create(self, validated_data: dict) -> CustomUser:
        validated_data.pop('turnstile_token', None)
        user = CustomUser(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data.get('username', '')[:40],
            user_choices='expert',
        )
        user.set_password(validated_data['password'])
        user.email_verified = False
        user.is_active = True
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    turnstile_token = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default='',
    )

    def validate(self, attrs: dict) -> dict:
        attrs = _require_turnstile(self, attrs)
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid email or password')
        attrs['user'] = user
        return attrs


class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    turnstile_token = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default='',
    )

    def validate(self, attrs: dict) -> dict:
        return _require_turnstile(self, attrs)


class ChangePasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Password does not match'}
            )
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)}) from exc
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    is_pro = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'user_choices',
            'is_pro',
        ]

    def get_is_pro(self, obj: CustomUser) -> bool:
        sub = Subscription.objects.filter(user=obj).first()
        return bool(sub and sub.is_pro)
