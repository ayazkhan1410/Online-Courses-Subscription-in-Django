import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLearnFocusMode } from '@/hooks/useLearnFocusMode'

describe('useLearnFocusMode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists focus mode in localStorage', () => {
    const { result } = renderHook(() => useLearnFocusMode())
    expect(result.current.focusMode).toBe(false)
    act(() => {
      result.current.toggleFocusMode()
    })
    expect(result.current.focusMode).toBe(true)
    expect(localStorage.getItem('learn-focus-mode')).toBe('1')
  })
})