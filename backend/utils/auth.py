"""Auth helpers for password recovery and Google sign-in."""

from __future__ import annotations

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import CustomUser
from utils.email import send_password_reset_email

logger = logging.getLogger(__name__)


def issue_password_reset(email: str) -> None:
    """Send reset mail if the account exists. Silent when missing."""
    user = CustomUser.objects.filter(email__iexact=email).first()
    if user is None:
        return
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    send_password_reset_email(user.email, f'{uid}.{token}')


def reset_password(token: str, password: str) -> bool:
    try:
        uidb64, raw_token = token.split('.', 1)
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = CustomUser.objects.get(pk=uid)
    except (ValueError, TypeError, OverflowError, CustomUser.DoesNotExist):
        return False

    if not default_token_generator.check_token(user, raw_token):
        return False

    user.set_password(password)
    user.save(update_fields=['password'])
    return True


def login_payload(user: CustomUser) -> dict:
    from accounts.serializers import UserSerializer

    token, _ = Token.objects.get_or_create(user=user)
    refresh = RefreshToken.for_user(user)
    return {
        'token': token.key,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }


def verify_google_credential(credential: str) -> dict:
    client_id = settings.GOOGLE_OAUTH_CLIENT_ID
    if not client_id:
        raise ValueError('Google sign-in is not configured')
    try:
        payload = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
        )
    except Exception as exc:
        logger.info('Google token verification failed: %s', exc)
        raise ValueError('Invalid Google credential') from exc

    if not payload.get('email_verified'):
        raise ValueError('Google email is not verified')
    iss = payload.get('iss', '')
    if iss not in ('accounts.google.com', 'https://accounts.google.com'):
        raise ValueError('Invalid Google credential')
    if not payload.get('email') or not payload.get('sub'):
        raise ValueError('Invalid Google credential')
    return payload


def _secure_unverified_google_link(user: CustomUser) -> None:
    """Drop password and sessions for an unverified email Google link."""
    from accounts.models import EmailVerificationCode

    user.set_unusable_password()
    EmailVerificationCode.objects.filter(user=user).delete()
    Token.objects.filter(user=user).delete()


def get_or_create_google_user(payload: dict) -> CustomUser:
    email = str(payload['email']).strip().lower()
    sub = str(payload['sub'])
    name = (payload.get('name') or email.split('@')[0])[:40]
    username = email.split('@')[0][:40]

    user = CustomUser.objects.filter(google_sub=sub).first()
    if user is not None:
        if not user.email_verified:
            _secure_unverified_google_link(user)
            user.email_verified = True
            user.save(update_fields=['password', 'email_verified'])
        return user

    user = CustomUser.objects.filter(email__iexact=email).first()
    if user is not None:
        updates: list[str] = []
        if not user.google_sub:
            user.google_sub = sub
            updates.append('google_sub')
        if not user.email_verified:
            _secure_unverified_google_link(user)
            user.email_verified = True
            updates.extend(['password', 'email_verified'])
        if updates:
            # Deduplicate while preserving order.
            user.save(update_fields=list(dict.fromkeys(updates)))
        return user

    user = CustomUser(
        email=email,
        username=username,
        full_name=name,
        user_choices='expert',
        google_sub=sub,
        email_verified=True,
    )
    user.set_unusable_password()
    user.save()
    return user
