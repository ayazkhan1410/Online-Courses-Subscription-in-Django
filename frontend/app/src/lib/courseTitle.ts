import { stripEmoji } from '@/lib/text'

const TRAILING_SUFFIXES = [
  ' Tutorial Series',
  ' Full Course',
  ' Course',
  ' Playlist',
  ' Tutorial',
] as const

/** Shorten a YouTube playlist/course title for path list and detail display. */
export function shortenCourseTitle(raw: string | null | undefined): string {
  let value = stripEmoji(raw)
  const pipe = value.indexOf(' | ')
  if (pipe >= 0) {
    value = value.slice(0, pipe)
  }
  value = value.replace(/\s+/g, ' ').trim()
  for (const suffix of TRAILING_SUFFIXES) {
    if (value.toLowerCase().endsWith(suffix.toLowerCase())) {
      value = value.slice(0, -suffix.length).trim()
      break
    }
  }
  return value
}
