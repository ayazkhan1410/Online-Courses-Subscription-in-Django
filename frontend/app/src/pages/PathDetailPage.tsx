import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError, formatApiError } from '@/api/client'
import { getPath } from '@/api/paths'
import type { Course } from '@/api/types'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { shortenCourseTitle } from '@/lib/courseTitle'

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

  return (
    <li className="path-route-step">
      <div className="path-route-track" aria-hidden="true">
        <span className={`path-rail-node ${state}`} />
        <span className="path-rail-connector" />
      </div>
      <div className="path-route-body">
        {note ? <p className="dim small path-route-note">{note}</p> : null}
        <CourseCard
          course={{
            ...course,
            courses_name: shortenCourseTitle(course.courses_name),
          }}
        />
      </div>
    </li>
  )
}