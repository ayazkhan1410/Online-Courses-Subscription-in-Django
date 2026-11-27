"""
Django settings for the Online Courses Subscription API.
"""

import logging
import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Vercel sets VERCEL=1 on build and runtime.
IS_VERCEL = os.getenv('VERCEL', '').lower() in ('1', 'true', 'yes')

DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('1', 'true', 'yes')

_EXAMPLE_SECRET_KEYS = frozenset(
    {
        '',
        'change-me-in-production',
        'django-insecure-dev-key-change-in-production',
    }
)

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
if IS_VERCEL:
    for host in ('.vercel.app', 'localhost', '127.0.0.1'):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

# SEO-proxied HTML goes through Django SecurityMiddleware. Google Identity
# Services popup needs opener access; same-origin blocks the blank GSI window.
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

AUTH_USER_MODEL = 'accounts.CustomUser'
PASSWORD_RESET_TIMEOUT = 3600

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'ckeditor',
    'embed_video',
    'anymail',
    'accounts',
    'mfa',
    'courses',
    'subscriptions',
    'contact',
    'learning',
    'seo',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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

_database_url = os.getenv('DATABASE_URL', '').strip()
if _database_url:
    DATABASES = {
        'default': dj_database_url.parse(
            _database_url,
            conn_max_age=0,
            conn_health_checks=True,
            ssl_require=True,
        )
    }
    DATABASES['default']['CONN_MAX_AGE'] = 0
    DATABASES['default']['CONN_HEALTH_CHECKS'] = True
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'courses'),
            'USER': os.getenv('POSTGRES_USER', 'courses'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'courses'),
            'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
            'CONN_MAX_AGE': 0,
            'CONN_HEALTH_CHECKS': True,
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
_static_backend = (
    'django.contrib.staticfiles.storage.StaticFilesStorage'
    if DEBUG
    else 'whitenoise.storage.CompressedManifestStaticFilesStorage'
)
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': _static_backend,
    },
}
WHITENOISE_MANIFEST_STRICT = False

MEDIA_URL = '/media/'
# Vercel filesystem is read-only except /tmp.
MEDIA_ROOT = Path('/tmp') / 'media' if IS_VERCEL else BASE_DIR / 'media'

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
        'progress_position': '60/min',
        'playlist_suggest': '5/min',
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
FRONTEND_INTERNAL_URL = os.getenv(
    'FRONTEND_INTERNAL_URL',
    FRONTEND_URL,
)
_api_default = FRONTEND_URL.replace(':4780', ':4781')
if _api_default == FRONTEND_URL:
    _api_default = 'http://localhost:4781'
API_PUBLIC_URL = os.getenv('API_PUBLIC_URL', _api_default)

STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '')
FIVERR_PROFILE_URL = os.getenv('FIVERR_PROFILE_URL', '')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
CRON_SECRET = os.getenv('CRON_SECRET', '')

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
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '').strip()
ANYMAIL = {
    'BREVO_API_KEY': BREVO_API_KEY,
}
EMAIL_INBOX_ENABLED = (
    False
    if IS_VERCEL
    else (
        os.getenv('EMAIL_INBOX_ENABLED', '').lower()
        in (
            '1',
            'true',
            'yes',
        )
        or DEBUG
        or TURNSTILE_TEST_MODE
    )
)
EMAIL_INBOX_DIR = (
    str(Path('/tmp') / 'mail_inbox')
    if IS_VERCEL
    else os.getenv('EMAIL_INBOX_DIR', '')
)
if BREVO_API_KEY:
    EMAIL_BACKEND = 'anymail.backends.brevo.EmailBackend'
elif os.getenv('EMAIL_BACKEND'):
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND')
elif EMAIL_INBOX_ENABLED:
    EMAIL_BACKEND = 'utils.mail_backend.InboxLocmemEmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]

if IS_VERCEL or not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    if SECRET_KEY in _EXAMPLE_SECRET_KEYS:
        raise ImproperlyConfigured(
            'DJANGO_SECRET_KEY must not use the example/dev value '
            'when DEBUG is False'
        )
    if not MFA_ENCRYPTION_KEY:
        raise ImproperlyConfigured(
            'MFA_ENCRYPTION_KEY is required when DEBUG is False'
        )
    SECURE_SSL_REDIRECT = True
    SECURE_REDIRECT_EXEMPT = [r'^healthz/?$']
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False

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

logger = logging.getLogger(__name__)
if not BREVO_API_KEY and not DEBUG and not EMAIL_INBOX_ENABLED:
    logger.warning(
        'BREVO_API_KEY is unset; SMTP may fail on hosts that block mail ports.'
    )
