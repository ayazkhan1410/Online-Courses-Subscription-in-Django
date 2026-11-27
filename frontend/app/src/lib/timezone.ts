import { updateSettings } from '@/api/auth'

const SYNC_KEY = 'timezone_synced'

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'Asia/Karachi'
  }
}

/** PATCH /auth/me/ once per browser session when signed in. */
export async function syncBrowserTimezoneOnce(): Promise<void> {
  if (sessionStorage.getItem(SYNC_KEY) === '1') return
  const tz = browserTimezone()
  sessionStorage.setItem(SYNC_KEY, '1')
  try {
    await updateSettings({ timezone: tz })
  } catch {
    sessionStorage.removeItem(SYNC_KEY)
  }
}