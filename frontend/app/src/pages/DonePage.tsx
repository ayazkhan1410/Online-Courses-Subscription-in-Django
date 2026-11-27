import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getCompletion } from '@/api/completions'
import { formatApiError } from '@/api/client'
import { Counter, Ticks } from '@/components/Counter'
import { Cover } from '@/components/Cover'
import { ErrorState } from '@/components/ErrorState'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { stripEmoji } from '@/lib/text'

export default function DonePage() {
  const { shareId = '' } = useParams()
  const query = useQuery({
    queryKey: ['completion', shareId],
    queryFn: () => getCompletion(shareId),
    enabled: Boolean(shareId),
  })

  const title = query.data
    ? `${stripEmoji(query.data.course.courses_name)} · finished`
    : 'Completion card'
  usePageTitle(title)

  if (query.isLoading) {
    return (
      <div className="page">
        <Skeleton className="h-[420px] max-w-3xl" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="page">
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const card = query.data
  const course = card.course
  const total = card.lesson_count
  const slug =
    course.creator?.is_owner ? 'study-with-ayaz' : course.category?.slug
  return (
    <div className="page done-page">
      <div className="done-wrap">
        <Panel className="done-card">
          <Cover
            title={stripEmoji(course.courses_name)}
            categoryLabel={course.category?.name}
            lessons={total}
            categorySlug={slug}
            imageUrl={course.thumbnail_url || course.course_image}
            className="done-cover"
          />
          <div className="done-body">
            <div className="done-count">
              <Counter done={total} total={total} />
            </div>
            <Ticks done={total} total={total} />
            <p className="done-learner">{card.learner_name}</p>
            <p className="meta">{card.finished_label}</p>
            <p className="done-teacher">
              {card.teacher_name}
              <span className="dim"> on Study with Ayaz</span>
            </p>
            <p className="dim small done-note">
              This is a completion record for shared progress, not a certificate or
              credential.
            </p>
            <Link className="btn btn-primary" to={`/courses/${course.slug}`}>
              Start this course
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}