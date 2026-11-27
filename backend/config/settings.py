"""
Django settings for the Online Courses Subscription API.
"""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('1', 'true', 'yes')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-dev-key-change-in-production'
    else:
        raise ImproperlyConfigured(
            'DJANGO_SECRET_KEY is required when DEBUG is False'
        )

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(
        ','
    )
    if host.strip()
]

AUTH_USER_MODEL = 'accounts.CustomUser'
PASSWORD_RESET_TIMEOUT = 3600

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'ckeditor',
    'embed_video',
    'accounts',
    'mfa',
    'courses',
    'subscriptions',
    'contact',
    'learning',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'courses'),
        'USER': os.getenv('POSTGRES_USER', 'courses'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'courses'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.MinimumLengthValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.CommonPasswordValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.NumericPasswordValidator'
        ),
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'auth': '10/min',
        'mfa': '10/min',
        'contact': '5/min',
    },
    'DEFAULT_PAGINATION_CLASS': (
        'rest_framework.pagination.PageNumberPagination'
    ),
    'PAGE_SIZE': 8,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:4780,http://127.0.0.1:4780',
    ).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4780')

STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '')
FIVERR_PROFILE_URL = os.getenv('FIVERR_PROFILE_URL', '')

MFA_ENCRYPTION_KEY = os.getenv('MFA_ENCRYPTION_KEY', '')

TURNSTILE_SITE_KEY = os.getenv('TURNSTILE_SITE_KEY', '')
TURNSTILE_SECRET_KEY = os.getenv('TURNSTILE_SECRET_KEY', '')
TURNSTILE_SITEVERIFY_URL = os.getenv(
    'TURNSTILE_SITEVERIFY_URL',
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
)
TURNSTILE_ALLOWED_HOSTNAMES = os.getenv('TURNSTILE_ALLOWED_HOSTNAMES', '')
TURNSTILE_TEST_MODE = os.getenv('TURNSTILE_TEST_MODE', 'False').lower() in (
    '1',
    'true',
    'yes',
)

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in (
    '1',
    'true',
    'yes',
)
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv(
    'DEFAULT_FROM_EMAIL',
    EMAIL_HOST_USER or 'webmaster@localhost',
)
EMAIL_INBOX_ENABLED = (
    os.getenv('EMAIL_INBOX_ENABLED', '').lower()
    in (
        '1',
        'true',
        'yes',
    )
    or DEBUG
    or TURNSTILE_TEST_MODE
)
EMAIL_INBOX_DIR = os.getenv('EMAIL_INBOX_DIR', '')
_default_mail_backend = (
    'utils.mail_backend.InboxLocmemEmailBackend'
    if EMAIL_INBOX_ENABLED
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', _default_mail_backend)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
