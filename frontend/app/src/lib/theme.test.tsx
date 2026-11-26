import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, readTheme, THEME_KEY } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('persists the chosen theme', () => {
    applyTheme('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(readTheme()).toBe('light')
    applyTheme('dark')
    expect(readTheme()).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })
})
