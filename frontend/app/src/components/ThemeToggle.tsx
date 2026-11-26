import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getThemeSnapshot, subscribeTheme, toggleTheme } from '@/lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'light' as const)
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-icon theme-toggle ${className}`.trim()}
      aria-label="Switch theme"
      onClick={() => toggleTheme()}
    >
      <Sun className="i i-sun" size={18} strokeWidth={1.5} />
      <Moon className="i i-moon" size={18} strokeWidth={1.5} />
    </button>
  )
}
