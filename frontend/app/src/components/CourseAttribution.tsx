import type { Course } from '@/api/types'

function CreatorMark({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
  }
  const initial = name.trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-raised font-mono text-xs"
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

export function CourseAttribution({ course }: { course: Course }) {
  const creator = course.creator
  const hasChannel = Boolean(creator && !creator.is_owner && creator.channel_url)
  if (!creator && !course.playlist_url && !course.attribution) return null

  return (
    <div data-testid="course-attribution" className="flex flex-col items-start gap-2">
      {creator?.is_owner ? <p className="text-sm text-ink-3">By Ayaz</p> : null}
      {creator && !creator.is_owner ? (
        hasChannel ? (
          <a
            href={creator.channel_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink"
          >
            <CreatorMark name={creator.name} avatarUrl={creator.avatar_url} />
            {creator.name}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-ink-2">
            <CreatorMark name={creator.name} avatarUrl={creator.avatar_url} />
            {creator.name}
          </span>
        )
      ) : null}
      {!creator && course.attribution ? (
        <p className="text-sm text-ink-3">{course.attribution}</p>
      ) : null}
      {course.playlist_url ? (
        <a
          href={course.playlist_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-ink-2 hover:text-ink"
        >
          Watch on YouTube
        </a>
      ) : null}
    </div>
  )
}
