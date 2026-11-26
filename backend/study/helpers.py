import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_email(email: str, token: str) -> bool:
    """Send password-reset email with a frontend recovery link."""
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    subject = 'Forget Password Recovery'
    message = (
        f'Hi, here is your link for password recovery: '
        f'{frontend_url}/change-password.html?token={token}'
    )
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    try:
        send_mail(subject, message, email_from, recipient_list)
        return True
    except Exception:
        logger.exception('Failed to send password recovery email to %s', email)
        return False
