import { useEffect } from 'react'

const SITE_NAME = 'Study with Ayaz'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:4781'

const DEFAULT_OG_IMAGE = `${API_BASE}/api/og/default.png`

export type PageMetaOptions = {
  description?: string
  canonicalPath?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(
  selector: string,
  attr: 'name' | 'property',
  key: string,
  content: string,
): void {
  if (!content) return
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  if (existing) {
    existing.content = content
    return
  }
  const node = document.createElement('meta')
  node.setAttribute(attr, key)
  node.content = content
  document.head.appendChild(node)
}

function upsertCanonical(href: string): void {
  if (!href) return
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

function upsertJsonLd(
  blocks: Record<string, unknown> | Record<string, unknown>[] | undefined,
): void {
  document
    .querySelectorAll('script[data-page-json-ld="1"]')
    .forEach((node) => node.remove())
  if (!blocks) return
  const list = Array.isArray(blocks) ? blocks : [blocks]
  list.forEach((block) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.pageJsonLd = '1'
    script.textContent = JSON.stringify(block)
    document.head.appendChild(script)
  })
}

export function usePageTitle(title: string, meta?: PageMetaOptions): void {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`
    document.title = fullTitle

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const canonical = meta?.canonicalPath
      ? `${origin}${meta.canonicalPath}`
      : typeof window !== 'undefined'
        ? window.location.href.split('#')[0]
        : ''

    const description = meta?.description ?? ''
    const ogTitle = meta?.ogTitle ?? fullTitle
    const ogDescription = meta?.ogDescription ?? description
    const ogImage = meta?.ogImage ?? DEFAULT_OG_IMAGE

    upsertMeta('meta[name="description"]', 'name', 'description', description)
    upsertCanonical(canonical)
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', ogTitle)
    upsertMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      ogDescription,
    )
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', ogImage)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    upsertMeta(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      'summary_large_image',
    )
    upsertJsonLd(meta?.jsonLd)
  }, [
    title,
    meta?.description,
    meta?.canonicalPath,
    meta?.ogTitle,
    meta?.ogDescription,
    meta?.ogImage,
    meta?.jsonLd,
  ])
}