import { describe, expect, it } from 'vitest'
import { computeResumeSeconds, formatClock } from '@/lib/resume'

describe('computeResumeSeconds', () => {
  it('rewinds 3 seconds', () => {
    expect(computeResumeSeconds(100, 600)).toBe(97)
  })

  it('starts at 0 when in the last 15 seconds', () => {
    expect(computeResumeSeconds(590, 600)).toBe(0)
    expect(computeResumeSeconds(585, 600)).toBe(0)
  })

  it('starts at 0 for tiny positions', () => {
    expect(computeResumeSeconds(3, 600)).toBe(0)
    expect(computeResumeSeconds(0, 600)).toBe(0)
  })
})

describe('formatClock', () => {
  it('formats mm:ss', () => {
    expect(formatClock(760)).toBe('12:40')
    expect(formatClock(65)).toBe('1:05')
  })
})
