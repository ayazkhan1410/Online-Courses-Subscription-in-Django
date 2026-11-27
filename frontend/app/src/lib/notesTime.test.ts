import { describe, expect, it } from 'vitest'
import { formatClock } from '@/lib/resume'

describe('notes timestamp formatting', () => {
  it('pads seconds for note rows', () => {
    expect(formatClock(252)).toBe('4:12')
    expect(formatClock(4 * 60 + 12)).toBe('4:12')
  })
})
