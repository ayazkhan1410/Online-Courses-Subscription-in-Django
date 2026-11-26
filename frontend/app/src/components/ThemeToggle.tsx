import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getThemeSnapshot, subscribeTheme, toggleTheme } from '@/lib/theme'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'dark' as const)
  const dark = theme === 'dark'
  const Icon = dark ? Sun : Moon
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-2 hover:bg-raised"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
      onClick={() => toggleTheme()}
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  )
}
