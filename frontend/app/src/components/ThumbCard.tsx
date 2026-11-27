import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { stripEmoji } from '@/lib/text'

function languageLabel(code: string | null | undefined): string {
  switch (code) {
    case 'ur':
      return 'Urdu'
    case 'hi':
      return 'Hindi'
    case 'ur-hi':
      return 'Urdu / Hindi'
    default:
      return 'English'
  }
}

function levelLabel(level: string | null | undefined): string {
  if (!level) return 'Beginner'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function ThumbCard({ course }: { course: Course }) {
  const title = stripEmoji(course.courses_name)
  const creator = course.creator
  const owner = Boolean(creator?.is_owner)
  const byName = owner ? 'Ayaz' : creator?.name || 'Creator'
  const image = course.thumbnail_url || course.course_image || ''
  const progress =
    course.is_enrolled && course.module_count > 0
      ? Math.max(0, Math.min(100, course.progress_percent))
      : null

  return (
    <Link to={`/courses/${course.slug}`} className="tcard">
      <div className="thumb">
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" />
        ) : null}
        {course.module_count > 0 ? (
          <span className="count">{course.module_count}</span>
        ) : null}
        {progress != null ? (
          <span className="prog" aria-hidden>
            <i style={{ width: `${progress}%` }} />
          </span>
        ) : null}
      </div>
      <h3>{title}</h3>
      <div className="by">{owner ? 'By Ayaz' : byName}</div>
      <div className="tags">
        {languageLabel(course.language)} · {levelLabel(course.level)}
      </div>
    </Link>
  )
}
