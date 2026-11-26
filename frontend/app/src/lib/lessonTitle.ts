import { stripEmoji } from '@/lib/text'

export type CleanLessonTitle = {
  counter: string | null
  title: string
}

/**
 * Clean YouTube lesson titles.
 * "Day 08/50 - How to Create List in Python | Python Full Course"
 * → counter "Day 08", title "How to create a list in Python"
 */
export function cleanLessonTitle(raw: string | null | undefined): CleanLessonTitle {
  let value = stripEmoji(raw)
  value = value.replace(/\s*\|\s*.*$/, '').trim()

  const dayMatch = value.match(
    /^(day\s*(\d{1,3}))\s*(?:\/\s*\d{1,3})?\s*[-–—:]\s*(.+)$/i,
  )
  if (dayMatch) {
    const n = String(Number(dayMatch[2])).padStart(2, '0')
    return {
      counter: `Day ${n}`,
      title: sentenceCase(dayMatch[3]),
    }
  }

  const lessonMatch = value.match(
    /^(lesson\s*(\d{1,3}))\s*[-–—:]\s*(.+)$/i,
  )
  if (lessonMatch) {
    const n = String(Number(lessonMatch[2])).padStart(2, '0')
    return {
      counter: `Lesson ${n}`,
      title: sentenceCase(lessonMatch[3]),
    }
  }

  return { counter: null, title: sentenceCase(value) }
}

function sentenceCase(input: string): string {
  const trimmed = input.replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function padCounter(done: number, total: number): { current: string; rest: string } {
  const width = Math.max(2, String(Math.max(total, 1)).length)
  return {
    current: String(Math.max(0, done)).padStart(width, '0'),
    rest: `/ ${total}`,
  }
}
