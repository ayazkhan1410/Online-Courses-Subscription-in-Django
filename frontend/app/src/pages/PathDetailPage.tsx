import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError, formatApiError } from '@/api/client'
import { getPath } from '@/api/paths'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { shortenCourseTitle } from '@/lib/courseTitle'

export default function PathDetailPage() {
  const { slug = '' } = useParams()
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
        <div className="grid" style={{ marginTop: 32 }}>
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
      <div className="grid grid-3" style={{ marginTop: 8 }}>
        {[...data.steps]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((step) => (
            <div key={step.course.id} className="path-step">
              {step.note ? (
                <p className="dim small" style={{ margin: '0 0 12px' }}>
                  {step.note}
                </p>
              ) : null}
              <CourseCard
                course={{
                  ...step.course,
                  courses_name: shortenCourseTitle(step.course.courses_name),
                }}
              />
            </div>
          ))}
      </div>
    </main>
  )
}