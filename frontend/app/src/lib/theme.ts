export const THEME_KEY = 'swa_theme'

export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return systemTheme()
}

export function getThemeSnapshot(): Theme {
  const current = document.documentElement.getAttribute('data-theme')
  if (current === 'light' || current === 'dark') return current
  return readTheme()
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
  listeners.forEach((listener) => listener())
}

export function toggleTheme(): Theme {
  const next: Theme = getThemeSnapshot() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
