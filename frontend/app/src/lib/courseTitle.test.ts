import { describe, expect, it } from 'vitest'
import { shortenCourseTitle } from '@/lib/courseTitle'

describe('shortenCourseTitle', () => {
  it('cuts at the first pipe separator', () => {
    expect(
      shortenCourseTitle('Python Programming Beginner Tutorials | Corey Schafer'),
    ).toBe('Python Programming Beginner Tutorials')
  })

  it('trims trailing Course / Playlist / Tutorial Series', () => {
    expect(shortenCourseTitle('Django Backend Course')).toBe('Django Backend')
    expect(shortenCourseTitle('React Hooks Playlist')).toBe('React Hooks')
    expect(shortenCourseTitle('Algorithms Tutorial Series')).toBe('Algorithms')
  })

  it('applies pipe cut before trailing suffix trim', () => {
    expect(
      shortenCourseTitle('Full Modern React Tutorial | Net Ninja Full Course'),
    ).toBe('Full Modern React')
  })

  it('returns empty for blank input', () => {
    expect(shortenCourseTitle('')).toBe('')
    expect(shortenCourseTitle(null)).toBe('')
  })
})
