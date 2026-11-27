from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.serializers import (
    ChangePasswordSerializer,
    ForgetPasswordSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)
from accounts.utils.email_verification import (
    issue_verification_code,
    resend_verification,
    verify_email_code,
)
from mfa.exceptions import MfaError
from mfa.utils.alerts import remember_device
from mfa.utils.challenge import mfa_gate
from utils.auth import (
    get_or_create_google_user,
    issue_password_reset,
    login_payload,
    reset_password,
    verify_google_credential,
)

RESEND_VERIFY_MESSAGE = (
    'If that email needs verification, a new code has been sent.'
)


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            issue_verification_code(user)
        except MfaError as exc:
            return Response(
                {'detail': exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                'verification_required': True,
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class JwtRefreshAPIView(TokenRefreshView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if not user.email_verified:
            try:
                issue_verification_code(user)
            except MfaError:
                pass
            return Response(
                {
                    'verification_required': True,
                    'email': user.email,
                }
            )
        try:
            pending = mfa_gate(user)
        except MfaError as exc:
            return Response(
                {'detail': exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if pending is not None:
            return Response(pending)
        django_login(request, user)
        remember_device(user, request)
        return Response(
            {
                'message': 'Login successful',
                **login_payload(user),
            }
        )


class GoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = verify_google_credential(
                serializer.validated_data['credential']
            )
            user = get_or_create_google_user(payload)
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        django_login(request, user)
        remember_device(user, request)
        return Response(login_payload(user))


class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        code = (request.data.get('code') or '').strip()
        if not email or not code:
            return Response(
                {'detail': 'Email and code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = verify_email_code(email, code)
        except MfaError as exc:
            return Response(
                {'detail': exc.message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        django_login(request, user)
        remember_device(user, request)
        return Response(login_payload(user))


class ResendVerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        if email:
            resend_verification(email)
        return Response({'message': RESEND_VERIFY_MESSAGE})


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
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ForgetPasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        issue_password_reset(serializer.validated_data['email'])
        return Response({'message': 'An email has been sent.'})


class ChangePasswordAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ok = reset_password(
            serializer.validated_data['token'],
            serializer.validated_data['password'],
        )
        if not ok:
            return Response(
                {'detail': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'message': 'Password changed successfully'})
