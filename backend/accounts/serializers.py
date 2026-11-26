from django.contrib.auth import authenticate
from rest_framework import serializers

from accounts.models import CustomUser
from subscriptions.models import Subscription


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=40)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=4)

    def validate_email(self, value: str) -> str:
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value

    def create(self, validated_data: dict) -> CustomUser:
        user = CustomUser(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data.get('username', '')[:40],
            confirm_password='',
            user_choices='expert',
        )
        user.set_password(validated_data['password'])
        user.confirm_password = ''
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        email = attrs.get('email')
        password = attrs.get('password')

        if not CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {'email': 'Please create an account first'}
            )

        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({'password': 'Invalid password'})

        attrs['user'] = user
        return attrs


class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email does not exist')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=4)
    confirm_password = serializers.CharField(write_only=True, min_length=4)

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Password does not match'}
            )
        return attrs


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
