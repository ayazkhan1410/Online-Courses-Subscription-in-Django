from html import escape

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.views import View
from django.views.decorators.http import require_GET

from seo.meta import meta_head_tags, resolve_meta
from seo.spa_shell import render_spa_shell

_HEAD_CACHE_TTL = 60 * 10


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


@require_GET
def seo_head(request):
    """JSON head fragment for Cloudflare Pages middleware."""
    raw_path = request.GET.get('path') or '/'
    cache_key = f'seo:head:v1:{raw_path}'
    cached = cache.get(cache_key)
    if cached is not None:
        response = JsonResponse(cached)
        response['Cache-Control'] = f'public, max-age={_HEAD_CACHE_TTL}'
        return response

    meta = resolve_meta(raw_path)
    if meta is None:
        payload = {'status': 404, 'head_html': ''}
    else:
        title = escape(meta.title, quote=False)
        head_html = f'<title>{title}</title>\n{meta_head_tags(meta)}'
        payload = {'status': 200, 'head_html': head_html}
    cache.set(cache_key, payload, _HEAD_CACHE_TTL)
    response = JsonResponse(payload)
    response['Cache-Control'] = f'public, max-age={_HEAD_CACHE_TTL}'
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
