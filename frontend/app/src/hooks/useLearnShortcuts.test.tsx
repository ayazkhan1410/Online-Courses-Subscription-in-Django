import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  isTypingTarget,
  useLearnShortcuts,
  type LearnShortcutHandlers,
} from '@/hooks/useLearnShortcuts'

function ShortcutHost({
  handlers,
  enabled = true,
}: {
  handlers: LearnShortcutHandlers
  enabled?: boolean
}) {
  useLearnShortcuts(handlers, enabled)
  return (
    <>
      <input data-testid="note-field" />
      <textarea data-testid="note-area" />
    </>
  )
}

const noopHandlers: LearnShortcutHandlers = {
  togglePlay: vi.fn(),
  seekRelative: vi.fn(),
  markComplete: vi.fn(),
  focusNewNote: vi.fn(),
  prevLesson: vi.fn(),
  nextLesson: vi.fn(),
  toggleFocusMode: vi.fn(),
  openShortcutsSheet: vi.fn(),
}

describe('isTypingTarget', () => {
  it('returns true for inputs and textareas', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(textarea)).toBe(true)
  })

  it('returns false for other elements', () => {
    const div = document.createElement('div')
    expect(isTypingTarget(div)).toBe(false)
  })
})

describe('useLearnShortcuts', () => {
  it('ignores shortcuts while typing in an input', () => {
    const markComplete = vi.fn()
    render(
      <ShortcutHost handlers={{ ...noopHandlers, markComplete }} />,
    )
    const input = document.querySelector('[data-testid="note-field"]')!
    fireEvent.keyDown(input, { key: 'm' })
    expect(markComplete).not.toHaveBeenCalled()
  })

  it('fires mark complete when not typing', () => {
    const markComplete = vi.fn()
    render(
      <ShortcutHost handlers={{ ...noopHandlers, markComplete }} />,
    )
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(markComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores shortcuts in a textarea', () => {
    const focusNewNote = vi.fn()
    render(
      <ShortcutHost handlers={{ ...noopHandlers, focusNewNote }} />,
    )
    const area = document.querySelector('[data-testid="note-area"]')!
    fireEvent.keyDown(area, { key: 'n' })
    expect(focusNewNote).not.toHaveBeenCalled()
  })
})