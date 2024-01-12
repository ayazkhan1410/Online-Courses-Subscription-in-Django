
from django.conf import settings
from django.core.mail import send_mail

def send_email(email, token):
    subject = "Forget Password Recovery"
    message = f"Hi, here is your link of forget password recovery http://127.0.0.1:8081/change-password/{token}"
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    send_mail(subject, message, email_from, recipient_list)
    return True