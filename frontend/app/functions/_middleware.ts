/**
 * Cloudflare Pages Function: inject SEO head for HTML routes, proxy
 * robots/sitemap, and never block the SPA on a slow API.
 */

type Env = {
  ASSETS: { fetch: typeof fetch }
  VITE_API_BASE_URL?: string
  API_PUBLIC_URL?: string
}

type PagesFunction<E = unknown> = (context: {
  request: Request
  env: E
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
}) => Response | Promise<Response>

const SEO_PATHS = [
  /^\/$/,
  /^\/about\/?$/,
  /^\/contact\/?$/,
  /^\/faq\/?$/,
  /^\/privacy\/?$/,
  /^\/terms\/?$/,
  /^\/services\/?$/,
  /^\/courses(\/.*)?$/,
  /^\/categories(\/.*)?$/,
  /^\/paths(\/.*)?$/,
  /^\/done\/[a-z0-9]{10}\/?$/,
]

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('Accept') || ''
  return accept.includes('text/html')
}

function apiOrigin(env: Env): string {
  const fromApi = (env.API_PUBLIC_URL || '').replace(/\/$/, '')
  if (fromApi) return fromApi
  const vite = (env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (vite.endsWith('/api')) return vite.slice(0, -4)
  return vite
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function shouldInject(pathname: string): boolean {
  return SEO_PATHS.some((pattern) => pattern.test(pathname))
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context
  const url = new URL(request.url)

  if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
    const origin = apiOrigin(env)
    if (!origin) return next()
    try {
      const upstream = await fetch(`${origin}${url.pathname}`, {
        headers: { Accept: request.headers.get('Accept') || '*/*' },
      })
      const body = await upstream.text()
      const type =
        url.pathname === '/robots.txt'
          ? 'text/plain; charset=utf-8'
          : 'application/xml; charset=utf-8'
      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=300',
        },
      })
    } catch {
      return next()
    }
  }

  if (url.pathname.startsWith('/assets/')) {
    return next()
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next()
  }

  if (!wantsHtml(request) || !shouldInject(url.pathname)) {
    return next()
  }

  const assetResponse = await env.ASSETS.fetch(
    new Request(new URL('/index.html', url.origin), request),
  )
  if (!assetResponse.ok) {
    return next()
  }

  const origin = apiOrigin(env)
  if (!origin) {
    return new Response(assetResponse.body, assetResponse)
  }

  const headUrl = `${origin}/api/seo/head/?path=${encodeURIComponent(url.pathname)}`
  const headPayload = await withTimeout(
    fetch(headUrl, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) return null
        return (await response.json()) as {
          status?: number
          head_html?: string
        }
      })
      .catch(() => null),
    2500,
  )

  const headHtml = headPayload?.head_html || ''
  if (!headHtml) {
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      headers: assetResponse.headers,
    })
  }

  const titleMatch = headHtml.match(/<title>([\s\S]*?)<\/title>/i)
  const titleText = titleMatch ? titleMatch[1] : ''
  const extras = headHtml.replace(/<title>[\s\S]*?<\/title>/i, '').trim()

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        if (titleText) {
          element.setInnerContent(titleText, { html: false })
        }
      },
    })
    .on('head', {
      element(element) {
        if (extras) {
          element.append(extras, { html: true })
        }
      },
    })
    .transform(assetResponse)
}
