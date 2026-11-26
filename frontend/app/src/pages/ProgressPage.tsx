import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getDashboard } from '@/api/learning'
import { buttonClass } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Progress } from '@/components/Progress'
import { Stat } from '@/components/Stat'
import { usePageTitle } from '@/hooks/usePageTitle'
import { stripEmoji } from '@/lib/text'

export default function ProgressPage() {
  usePageTitle('Progress')
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  if (query.isError) {
    return <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
  }
  const data = query.data
  if (!data) return null
  if (data.enrolled.length === 0) {
    return (
      <EmptyState
        title="No progress yet"
        body="Enroll in a course to start a record of finished lessons."
        actionLabel="Browse courses"
        to="/courses"
      />
    )
  }
  return (
    <div>
      <h1 className="text-[32px]">Progress</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Lessons complete" value={data.stats.completed_lessons} />
        <Stat label="Courses finished" value={data.stats.completed_courses} />
        <Stat label="Average progress" value={`${data.stats.avg_progress}%`} />
      </div>
      <ul className="mt-8 flex flex-col gap-4">
        {data.enrolled.map((item) => (
          <li key={item.id} className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <p>{stripEmoji(item.course.courses_name)}</p>
              <p className="font-mono text-sm tabular-nums text-ink-2">
                {item.course.progress_percent}%
              </p>
            </div>
            <div className="mt-4">
              <Progress value={item.course.progress_percent} />
            </div>
            <Link to={`/learn/${item.course.slug}/0`} className={buttonClass('ghost', 'sm', 'mt-4')}>
              Open
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
