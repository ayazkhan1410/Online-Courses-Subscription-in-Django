"""Auth helpers for password recovery."""

from __future__ import annotations

import uuid

from accounts.models import CustomUser, Profile
from utils.email import send_password_reset_email


def issue_password_reset(email: str) -> None:
    user = CustomUser.objects.get(email=email)
    token = str(uuid.uuid4())
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={'forget_token': token},
    )
    profile.forget_token = token
    profile.save(update_fields=['forget_token'])
    send_password_reset_email(user.email, token)


def reset_password(token: str, password: str) -> bool:
    profile = Profile.objects.filter(forget_token=token).select_related('user').first()
    if profile is None:
        return False

    user = profile.user
    user.set_password(password)
    user.save(update_fields=['password'])
    profile.forget_token = ''
    profile.save(update_fields=['forget_token'])
    return True
