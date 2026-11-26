from django.contrib.auth import authenticate
from rest_framework import serializers

from study.models import (
    Contact,
    CourseModule,
    Courses,
    CustomUser,
    Subscription,
    SubscriptionList,
)


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


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'message']


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
        # shortcut: password hash may exceed CharField(40); SQLite stores it.
        # Upgrade CustomUser.password max_length to 128 when schema change allowed.
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


class SubscriptionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionList
        fields = ['id', 'subscription_list', 'subscription_price']


class SubscriptionSerializer(serializers.ModelSerializer):
    subscription_list = SubscriptionListSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'subscription_list', 'is_pro']


class BecomeProSerializer(serializers.Serializer):
    membership = serializers.IntegerField()
    stripe_token = serializers.CharField()


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
