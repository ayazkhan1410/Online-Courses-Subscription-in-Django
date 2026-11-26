import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { Cover } from '@/components/Cover'
import { stripEmoji } from '@/lib/text'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function languageLabel(code: string | null | undefined): string {
  switch (code) {
    case 'ur':
      return 'Urdu'
    case 'hi':
      return 'Hindi'
    case 'ur-hi':
      return 'Urdu/Hindi'
    default:
      return 'English'
  }
}

function levelLabel(level: string | null | undefined): string {
  if (!level) return 'Beginner'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function CourseCard({ course }: { course: Course }) {
  const title = stripEmoji(course.courses_name)
  const short =
    title.length > 48 ? `${title.slice(0, 45).trim()}…` : title
  const creator = course.creator
  const owner = Boolean(creator?.is_owner)
  const byName = creator?.name || 'Creator'
  const progress =
    course.is_enrolled && course.module_count > 0
      ? Math.max(0, Math.min(100, course.progress_percent))
      : null

  return (
    <Link to={`/courses/${course.slug}`} className="card">
      <Cover
        title={short}
        categoryLabel={course.category?.name}
        lessons={course.module_count}
        categorySlug={
          creator?.is_owner ? 'study-with-ayaz' : course.category?.slug
        }
      />
      {progress != null ? (
        <div
          className="card-progress"
          aria-label={`${Math.round(progress)}% complete`}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="creator">
          <span className="avatar">{initials(byName)}</span>
          {owner ? 'By Ayaz' : byName}
        </div>
        <div className="meta">
          {languageLabel(course.language)} · {levelLabel(course.level)}
        </div>
      </div>
    </Link>
  )
}
