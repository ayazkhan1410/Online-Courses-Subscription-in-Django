import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError, formatApiError } from '@/api/client'
import { getPath } from '@/api/paths'
import type { Course } from '@/api/types'
import { Cover } from '@/components/Cover'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { shortenCourseTitle } from '@/lib/courseTitle'
import { stripEmoji } from '@/lib/text'

type PathNodeState = 'done' | 'started' | 'todo' | 'outlined'

function pathNodeState(progress: number, loggedIn: boolean): PathNodeState {
  if (!loggedIn) return 'outlined'
  if (progress >= 100) return 'done'
  if (progress > 0) return 'started'
  return 'todo'
}

export default function PathDetailPage() {
  const { slug = '' } = useParams()
  const { token } = useAuth()
  const loggedIn = Boolean(token)
  const path = useQuery({
    queryKey: ['path', slug],
    queryFn: () => getPath(slug),
    enabled: Boolean(slug),
  })

  usePageTitle(path.data?.title ?? 'Learning path')

  if (path.isLoading) {
    return (
      <main className="wrap">
        <Skeleton className="h-24" />
        <div className="path-route" style={{ marginTop: 32 }}>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </main>
    )
  }

  if (path.error instanceof ApiError && path.error.status === 404) {
    return (
      <main className="wrap">
        <EmptyState
          title="Path not found"
          body="This learning path is not published."
          actionLabel="All paths"
          to="/paths"
        />
      </main>
    )
  }

  if (path.isError) {
    return (
      <main className="wrap">
        <ErrorState message={formatApiError(path.error)} onRetry={() => void path.refetch()} />
      </main>
    )
  }

  const data = path.data
  if (!data) return null

  const steps = [...data.steps].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <main className="wrap">
      <p className="meta small">
        <Link className="link" to="/paths">
          Learning paths
        </Link>
      </p>
      <div className="page-head" style={{ gridTemplateColumns: '1fr', paddingTop: 16 }}>
        <div>
          <h1 className="h1">{data.title}</h1>
          <p className="lead">{data.summary}</p>
        </div>
      </div>
      <ol className="path-route">
        {steps.map((step) => (
          <PathRouteStep
            key={step.course.id}
            note={step.note}
            course={step.course}
            loggedIn={loggedIn}
          />
        ))}
      </ol>
    </main>
  )
}

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

function PathRouteStep({
  note,
  course,
  loggedIn,
}: {
  note: string
  course: Course
  loggedIn: boolean
}) {
  const state = pathNodeState(course.progress_percent ?? 0, loggedIn)
  const title = shortenCourseTitle(stripEmoji(course.courses_name))
  const level = course.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : 'Beginner'

  return (
    <li className="path-route-step">
      <div className="path-route-track" aria-hidden="true">
        <span className={`path-rail-node ${state}`} />
        <span className="path-rail-connector" />
      </div>
      <div className="path-route-body">
        {note ? <p className="dim small path-route-note">{note}</p> : null}
        <Link to={`/courses/${course.slug}`} className="path-route-card">
          <Cover
            className="path-route-cover"
            title={title}
            categoryLabel={course.category?.name}
            lessons={course.module_count}
            categorySlug={
              course.creator?.is_owner ? 'study-with-ayaz' : course.category?.slug
            }
            imageUrl={course.thumbnail_url || course.course_image}
          />
          <div className="path-route-card-meta">
            <div className="card-title">{title}</div>
            <div className="meta">
              {languageLabel(course.language)} · {level}
              {course.module_count ? ` · ${course.module_count} lessons` : ''}
            </div>
          </div>
        </Link>
      </div>
    </li>
  )
}