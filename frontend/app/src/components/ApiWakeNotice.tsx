import { useEffect, useState } from 'react'
import { subscribeApiWake } from '@/lib/apiWake'

export function ApiWakeNotice() {
  const [waking, setWaking] = useState(false)

  useEffect(() => subscribeApiWake(setWaking), [])

  if (!waking) return null

  return (
    <p className="api-wake-notice" role="status">
      Waking up the server, this can take up to a minute on the free plan.
    </p>
  )
}
