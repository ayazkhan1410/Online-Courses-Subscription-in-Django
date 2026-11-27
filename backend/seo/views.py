from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.views import View

from seo.meta import resolve_meta
from seo.spa_shell import render_spa_shell


class SpaMetaView(View):
    """Serve the SPA shell with route-specific meta tags."""

    def get(self, request, *_args, **_kwargs):
        meta = resolve_meta(request.path)
        if meta is None:
            return HttpResponseNotFound('Not found')
        body = render_spa_shell(meta)
        response = HttpResponse(body, content_type='text/html; charset=utf-8')
        response['Cache-Control'] = 'public, max-age=300'
        return response


def robots_txt(_request):
    base = settings.FRONTEND_URL.rstrip('/')
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /dashboard',
        'Disallow: /learn',
        'Disallow: /api',
        f'Sitemap: {base}/sitemap.xml',
        '',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')
