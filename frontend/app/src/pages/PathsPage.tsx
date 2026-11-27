import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { listPaths } from '@/api/paths'
import type { LearningPath, PathStepBrief } from '@/api/types'
import { Counter, Ticks } from '@/components/Counter'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'
import { shortenCourseTitle } from '@/lib/courseTitle'

function courseNames(path: LearningPath): string[] {
  const raw = path.course_names?.length
    ? path.course_names
    : (path.steps ?? [])
        .map((step: PathStepBrief) => step.course?.title)
        .filter((title): title is string => Boolean(title))
  return raw.map((title) => shortenCourseTitle(title)).filter(Boolean)
}

function courseCount(path: LearningPath): number {
  return path.step_count ?? path.course_count ?? courseNames(path).length
}

export default function PathsPage() {
  usePageTitle('Learning paths', {
    description: PAGE_DESCRIPTIONS.paths,
    canonicalPath: '/paths',
  })
  const { token } = useAuth()
  const paths = useQuery({ queryKey: ['paths'], queryFn: listPaths })

  return (
    <main className="wrap">
      <div className="page-head" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <h1 className="h1">Learning paths</h1>
          <p className="lead">
            Not sure where to start? Follow one of these in order. Each path uses free courses from
            the library, picked so the next one starts where the last one ended.
          </p>
        </div>
      </div>

      {paths.isLoading ? (
        <div className="paths-grid">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : null}

      {paths.isError ? (
        <ErrorState message={formatApiError(paths.error)} onRetry={() => void paths.refetch()} />
      ) : null}

      {paths.isSuccess && paths.data.length === 0 ? (
        <EmptyState
          title="No paths yet"
          body="Learning paths are not published yet."
          actionLabel="Browse courses"
          to="/courses"
        />
      ) : null}

      {paths.isSuccess && paths.data.length > 0 ? (
        <div className="paths-grid">
          {paths.data.map((path) => (
            <PathPanel key={path.slug} path={path} loggedIn={Boolean(token)} />
          ))}
        </div>
      ) : null}
    </main>
  )
}

function PathPanel({ path, loggedIn }: { path: LearningPath; loggedIn: boolean }) {
  const names = courseNames(path)
  const total = path.total_count ?? courseCount(path)
  const done = path.completed_count
  const showProgress =
    loggedIn && typeof done === 'number' && typeof total === 'number' && total > 0

  return (
    <article className="panel path-panel">
      <Link to={`/paths/${path.slug}`}>
        <h2 className="h3">{path.title}</h2>
      </Link>
      <p className="dim small" style={{ margin: '8px 0 0' }}>
        {path.summary}
      </p>
      <p className="meta" style={{ margin: '12px 0 0' }}>
        {path.level} · {total} courses
      </p>
      {showProgress ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cont-count">
            <Counter done={done} total={total} />
          </div>
          <Ticks done={done} total={total} />
        </div>
      ) : null}
      <ol className="path-courses mono">
        {names.map((name, index) => (
          <li key={`${path.slug}-${index}`}>
            <span className="meta num">{String(index + 1).padStart(2, '0')}</span>
            <span>{name}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}