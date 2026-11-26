from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    username = models.CharField(max_length=40, null=True, blank=True)
    full_name = models.CharField(max_length=40)
    email = models.EmailField(unique=True)
    # Django password hashes need more than 40 chars (Postgres enforces length).
    password = models.CharField(max_length=128)
    confirm_password = models.CharField(max_length=128, blank=True, default='')
    user_choices = models.CharField(
        max_length=30,
        choices=[
            ('expert', 'Expert'),
            ('business', 'Business'),
            ('admin', 'Admin'),
        ],
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return f'{self.email}'


class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    forget_token = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.user.email
