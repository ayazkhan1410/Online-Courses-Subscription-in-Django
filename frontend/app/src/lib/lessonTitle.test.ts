import { describe, expect, it } from 'vitest'
import { cleanLessonTitle, padCounter } from '@/lib/lessonTitle'

describe('cleanLessonTitle', () => {
  it('splits day counter and sentence-cases the title', () => {
    expect(
      cleanLessonTitle(
        'Day 08/50 - How to Create List in Python | Python Full Course',
      ),
    ).toEqual({
      counter: 'Day 08',
      title: 'How to create list in python',
    })
  })

  it('handles lesson prefix without a pipe suffix', () => {
    expect(cleanLessonTitle('Lesson 3: Variables In Python')).toEqual({
      counter: 'Lesson 03',
      title: 'Variables in python',
    })
  })

  it('falls back to sentence case when there is no counter', () => {
    expect(cleanLessonTitle('Basic Introduction And Setup')).toEqual({
      counter: null,
      title: 'Basic introduction and setup',
    })
  })
})

describe('padCounter', () => {
  it('zero-pads against the total width', () => {
    expect(padCounter(7, 50)).toEqual({ current: '07', rest: '/ 50' })
  })
})
