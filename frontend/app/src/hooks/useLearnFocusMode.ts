import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'learn-focus-mode'

function readStored(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

export function useLearnFocusMode() {
  const [focusMode, setFocusMode] = useState(readStored)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, focusMode ? '1' : '0')
  }, [focusMode])

  const toggleFocusMode = useCallback(() => {
    setFocusMode((on) => !on)
  }, [])

  return { focusMode, setFocusMode, toggleFocusMode }
}