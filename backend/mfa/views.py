from django.contrib.auth import login as django_login
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from mfa.exceptions import MfaError
from mfa.serializers import (
    MfaConfirmSerializer,
    MfaDisableSerializer,
    MfaResendSerializer,
    MfaVerifySerializer,
)
from mfa.utils.alerts import remember_device
from mfa.utils.challenge import (
    disable_mfa,
    resend_challenge,
    status_for,
    verify_challenge,
)
from mfa.utils.totp import confirm_setup, start_setup
from utils.auth import login_payload


def _mfa_error(exc: MfaError) -> Response:
    return Response({'detail': exc.message}, status=status.HTTP_400_BAD_REQUEST)


class MfaVerifyAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'mfa'

    def post(self, request):
        serializer = MfaVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = verify_challenge(
                serializer.validated_data['challenge_token'],
                serializer.validated_data['code'],
                serializer.validated_data['method'],
            )
        except MfaError as exc:
            return _mfa_error(exc)
        django_login(request, user)
        remember_device(user, request)
        return Response(login_payload(user))


class MfaResendAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'mfa'

    def post(self, request):
        serializer = MfaResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            resend_challenge(serializer.validated_data['challenge_token'])
        except MfaError as exc:
            return _mfa_error(exc)
        return Response({'message': 'A new code has been sent.'})


class MfaSetupAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            payload = start_setup(request.user)
        except MfaError as exc:
            return _mfa_error(exc)
        return Response(payload)


class MfaConfirmAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MfaConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            codes = confirm_setup(request.user, serializer.validated_data['code'])
        except MfaError as exc:
            return _mfa_error(exc)
        # Rotate API tokens after MFA is first enabled.
        Token.objects.filter(user=request.user).delete()
        Token.objects.create(user=request.user)
        payload = login_payload(request.user)
        return Response(
            {
                'recovery_codes': codes,
                'token': payload['token'],
                'access': payload['access'],
                'refresh': payload['refresh'],
            }
        )


class MfaDisableAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MfaDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            disable_mfa(
                request.user,
                serializer.validated_data.get('password') or '',
                serializer.validated_data.get('code') or '',
            )
        except MfaError as exc:
            return _mfa_error(exc)
        return Response({'message': 'Two-factor authentication is off.'})


class MfaStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(status_for(request.user))
