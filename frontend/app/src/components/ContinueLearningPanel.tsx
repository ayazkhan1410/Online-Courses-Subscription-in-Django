import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { Counter, Ticks } from '@/components/Counter'
import { Cover } from '@/components/Cover'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/lib/cn'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { lessonIndex, stripEmoji } from '@/lib/text'

function progressLessons(percent: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(total, Math.round((percent / 100) * total))
}

type ContinueLearningPanelProps = {
  course: Course
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  showSecondaryAction?: boolean
  showHeadingMeta?: boolean
  className?: string
}

export function ContinueLearningPanel({
  course,
  primaryLabel = 'Resume',
  secondaryHref = '/dashboard/courses',
  secondaryLabel = 'All my courses',
  showSecondaryAction = true,
  showHeadingMeta = true,
  className,
}: ContinueLearningPanelProps) {
  const done = progressLessons(course.progress_percent, course.module_count)
  const index = lessonIndex(course.progress_percent, course.module_count)
  const module = course.course_modules?.[index]
  const lesson = module ? cleanLessonTitle(module.module_name) : null
  const learnHref = `/learn/${course.slug}/${module?.id ?? 0}`

  return (
    <Panel className={cn('continue', className)}>
      <Cover
        title={stripEmoji(course.courses_name)}
        categoryLabel={course.category?.name}
        lessons={course.module_count}
        categorySlug={course.creator?.is_owner ? 'study-with-ayaz' : course.category?.slug}
        imageUrl={course.thumbnail_url || course.course_image}
      />
      <div className="cont-body">
        {showHeadingMeta ? (
          <div className="meta">Continue · {stripEmoji(course.courses_name)}</div>
        ) : null}
        <h2 className="h2">
          {lesson?.counter ? `${lesson.counter} · ` : ''}
          {lesson?.title ?? stripEmoji(course.courses_name)}
        </h2>
        <div className="cont-count">
          <Counter done={done} total={course.module_count} />
        </div>
        <Ticks done={done} total={course.module_count} />
        <div className="hero-actions">
          <Link
            className={cn('btn btn-primary', primaryLabel === 'Continue' ? 'btn-lg' : '')}
            to={learnHref}
          >
            {primaryLabel === 'Resume' ? (
              <Play className="i-16" size={16} strokeWidth={1.5} aria-hidden />
            ) : null}
            {primaryLabel}
          </Link>
          {showSecondaryAction ? (
            <Link
              className={cn('btn', primaryLabel === 'Continue' ? 'btn-lg' : '')}
              to={secondaryHref}
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}

export function ContinueLearningSkeleton({ className }: { className?: string }) {
  return (
    <Panel className={cn('continue', className)} aria-busy="true" aria-hidden>
      <Skeleton className="cover h-full min-h-48 w-full" />
      <div className="cont-body">
        <Skeleton className="h-3.5 w-[55%]" />
        <Skeleton className="h-7 w-[92%]" />
        <Skeleton className="h-10 w-[40%]" />
        <Skeleton className="h-[18px] w-full" />
        <div className="hero-actions">
          <Skeleton className="h-11 w-[120px]" />
          <Skeleton className="h-11 w-[140px]" />
        </div>
      </div>
    </Panel>
  )
}