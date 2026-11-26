import { useQuery } from '@tanstack/react-query'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { getConfig } from '@/api/config'
import { loadScript } from '@/lib/scripts'
import '@/types/external'

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export type TurnstileHandle = {
  getToken: () => string
  reset: () => void
}

export const TurnstileWidget = forwardRef<TurnstileHandle>(function TurnstileWidget(_, ref) {
  const host = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const config = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 60_000,
  })
  const siteKey = config.data?.turnstile_site_key ?? ''

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (!widgetId.current || !window.turnstile) return ''
      return window.turnstile.getResponse(widgetId.current) || ''
    },
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    },
  }))

  useEffect(() => {
    const el = host.current
    if (!siteKey || !el) return
    let cancel = false
    loadScript(SRC)
      .then(() => {
        if (cancel || !window.turnstile || !host.current) return
        widgetId.current = window.turnstile.render(host.current, { sitekey: siteKey })
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={host} />
})
