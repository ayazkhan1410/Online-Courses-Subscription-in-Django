import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getDashboard } from '@/api/learning'
import type { Course, Enrollment } from '@/api/types'
import { buttonClass } from '@/components/Button'
import { Card } from '@/components/Card'
import { CourseCard } from '@/components/CourseCard'
import { CourseCover } from '@/components/CourseCover'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Stat } from '@/components/Stat'
import { usePageTitle } from '@/hooks/usePageTitle'
import { lessonIndex, lessonLabel, stripEmoji } from '@/lib/text'

function preferEnrolledCategories(recommended: Course[], enrolled: Enrollment[]): Course[] {
  const slugs = new Set(
    enrolled
      .map((item) => item.course.category?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  )
  if (slugs.size === 0) return recommended
  return [...recommended].sort((a, b) => {
    const aHit = a.category && slugs.has(a.category.slug) ? 0 : 1
    const bHit = b.category && slugs.has(b.category.slug) ? 0 : 1
    return aHit - bHit
  })
}

export default function DashboardHomePage() {
  usePageTitle('Dashboard')
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const month = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date())

  if (query.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
  }

  const data = query.data
  const current = data.continue_learning[0]
  const stats = data.stats
  const recommended = preferEnrolledCategories(data.recommended, data.enrolled)

  return (
    <div>
      <h1 className="text-[32px]">Your learning · {month}</h1>
      <p className="mt-2 text-ink-2">{data.user.display_name}</p>

      <div className="mt-8">
        {current ? (
          <Card className="grid gap-6 md:grid-cols-[280px_1fr] md:items-center">
            <CourseCover
              title={stripEmoji(current.courses_name)}
              categorySlug={current.category?.slug}
              categoryIcon={current.category?.icon}
              imageUrl={current.thumbnail_url || current.course_image}
              meta={lessonLabel(
                lessonIndex(current.progress_percent, current.module_count),
                current.module_count,
              )}
            />
            <div>
              <p className="font-mono text-sm text-accent-ink">
                {lessonLabel(
                  lessonIndex(current.progress_percent, current.module_count),
                  current.module_count,
                )}
              </p>
              <h2 className="mt-2 text-2xl">{stripEmoji(current.courses_name)}</h2>
              <Link to={`/learn/${current.slug}/0`} className={buttonClass('primary', 'md', 'mt-6')}>
                Resume
              </Link>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Nothing in progress"
            body="Enroll in a course to pick up a lesson here."
            actionLabel="Browse courses"
            to="/courses"
          />
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Enrolled" value={stats.enrolled_courses} />
        <Stat label="Lessons complete" value={stats.completed_lessons} />
        <Stat label="Courses finished" value={stats.completed_courses} />
        <Stat label="Average progress" value={`${stats.avg_progress}%`} />
      </div>

      <Card className="mt-8">
        <h2 className="text-xl">Lesson days</h2>
        <p className="mt-2 text-sm text-ink-2">
          Completed lesson days are not tracked yet, so there is no streak calendar.
        </p>
      </Card>

      <h2 className="mt-10 text-2xl">Enrolled</h2>
      {data.enrolled.length === 0 ? (
        <p className="mt-3 text-ink-2">No enrollments yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.enrolled.map((item) => (
            <CourseCard key={item.id} course={item.course} />
          ))}
        </div>
      )}

      <h2 className="mt-10 text-2xl">Suggested next</h2>
      {recommended.length === 0 ? (
        <p className="mt-3 text-ink-2">No further courses to suggest.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {recommended.slice(0, 4).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
