import { useEffect } from 'react'

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable === true
}

export type LearnShortcutHandlers = {
  togglePlay: () => void
  seekRelative: (deltaSeconds: number) => void
  markComplete: () => void
  focusNewNote: () => void
  prevLesson: () => void
  nextLesson: () => void
  toggleFocusMode: () => void
  openShortcutsSheet: () => void
}

function matchKey(event: KeyboardEvent): string | null {
  const base = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (event.shiftKey && (base === 'n' || base === 'p')) {
    return `shift+${base}`
  }
  if (event.ctrlKey || event.altKey || event.metaKey) return null
  return base
}

const ACTIONS: Record<string, keyof LearnShortcutHandlers> = {
  k: 'togglePlay',
  ' ': 'togglePlay',
  j: 'seekRelative',
  l: 'seekRelative',
  m: 'markComplete',
  n: 'focusNewNote',
  'shift+n': 'nextLesson',
  'shift+p': 'prevLesson',
  f: 'toggleFocusMode',
  '?': 'openShortcutsSheet',
}

export function useLearnShortcuts(
  handlers: LearnShortcutHandlers,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const key = matchKey(event)
      if (!key) return
      const action = ACTIONS[key]
      if (!action) return

      event.preventDefault()

      if (action === 'seekRelative') {
        const delta = key === 'j' ? -10 : 10
        handlers.seekRelative(delta)
        return
      }
      const fn = handlers[action]
      fn()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, handlers])
}