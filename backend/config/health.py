"""Liveness probe with no database access."""

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET


@csrf_exempt
@require_GET
def healthz(_request):
    """Return 200 ok without touching the database or throttles."""
    return HttpResponse('ok', content_type='text/plain')
