import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { getConfig } from '@/api/config'
import { loadScript } from '@/lib/scripts'
import '@/types/external'

const GIS = 'https://accounts.google.com/gsi/client'

export function GoogleButton({
  onCredential,
}: {
  onCredential: (credential: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  useEffect(() => {
    callbackRef.current = onCredential
  })
  const config = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 60_000,
  })
  const clientId = config.data?.google_client_id ?? ''

  useEffect(() => {
    const el = host.current
    if (!clientId || !el) return
    let cancel = false
    loadScript(GIS)
      .then(() => {
        if (cancel || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => callbackRef.current(response.credential),
        })
        const theme = document.documentElement.getAttribute('data-theme')
        window.google.accounts.id.renderButton(el, {
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(el.offsetWidth || 320, 400),
        })
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [clientId])

  if (config.isSuccess && !clientId) return null
  return <div ref={host} className="min-h-10" />
}
