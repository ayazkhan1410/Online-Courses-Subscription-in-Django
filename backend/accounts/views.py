import uuid

from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomUser, Profile
from accounts.serializers import (
    ChangePasswordSerializer,
    ForgetPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)
from utils.email import send_password_reset_email


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'message': 'Account created successfully',
                'token': token.key,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)
        return Response(
            {
                'message': 'Login successful',
                'token': token.key,
                'user': UserSerializer(user).data,
            }
        )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        django_logout(request)
        return Response({'message': 'Logged out successfully'})


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user_obj = CustomUser.objects.get(email=email)
        token = str(uuid.uuid4())
        profile_obj, _ = Profile.objects.get_or_create(
            user=user_obj,
            defaults={'forget_token': token},
        )
        profile_obj.forget_token = token
        profile_obj.save()
        send_password_reset_email(user_obj.email, token)
        return Response({'message': 'An email has been sent.'})


class ChangePasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        profile_obj = Profile.objects.filter(forget_token=token).first()
        if profile_obj is None:
            return Response(
                {'detail': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_obj = profile_obj.user
        user_obj.set_password(serializer.validated_data['password'])
        user_obj.save()
        profile_obj.forget_token = ''
        profile_obj.save()
        return Response({'message': 'Password changed successfully'})
