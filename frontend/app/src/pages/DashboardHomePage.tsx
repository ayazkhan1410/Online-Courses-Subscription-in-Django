import { useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getDashboard } from '@/api/learning'
import type { Course, Enrollment } from '@/api/types'
import { Counter, Ticks } from '@/components/Counter'
import { CourseCard } from '@/components/CourseCard'
import { Cover } from '@/components/Cover'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { lessonIndex, stripEmoji } from '@/lib/text'

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

function progressLessons(percent: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(total, Math.round((percent / 100) * total))
}

export default function DashboardHomePage() {
  usePageTitle('Dashboard')
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

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
    <>
      <div className="top">
        <div>
          <div className="meta">{today}</div>
          <h1 className="h1">Your learning</h1>
        </div>
        <Link className="btn btn-sm" to="/courses">
          Find a course
        </Link>
      </div>

      {current ? (
        <ContinuePanel course={current} />
      ) : (
        <Panel>
          <EmptyState
            title="Nothing in progress"
            body="Enroll in a course to pick up a lesson here."
            actionLabel="Browse courses"
            to="/courses"
          />
        </Panel>
      )}

      <section className="stats">
        <Panel className="stat">
          <div className="label">Lessons completed</div>
          <div className="fig">{stats.completed_lessons}</div>
        </Panel>
        <Panel className="stat">
          <div className="label">Courses in progress</div>
          <div className="fig">{stats.enrolled_courses - stats.completed_courses}</div>
        </Panel>
        <Panel className="stat">
          <div className="label">Courses finished</div>
          <div className="fig">{stats.completed_courses}</div>
        </Panel>
      </section>

      <section className="split">
        <Panel>
          <div className="p-head">
            <h2 className="h3">Lessons this week</h2>
          </div>
          <p className="dim small">Daily lesson counts are not tracked yet.</p>
        </Panel>
        <Panel>
          <div className="p-head">
            <h2 className="h3">In progress</h2>
            <Link className="link small" to="/dashboard/courses">
              All
            </Link>
          </div>
          {data.enrolled.length === 0 ? (
            <p className="dim small">No enrollments yet.</p>
          ) : (
            <ul className="prog-list">
              {data.enrolled.slice(0, 5).map((item) => {
                const course = item.course
                const done = progressLessons(course.progress_percent, course.module_count)
                return (
                  <li key={item.id}>
                    <div className="prog-row">
                      <Link to={`/courses/${course.slug}`}>{stripEmoji(course.courses_name)}</Link>
                      <span className="meta">
                        {done}/{course.module_count}
                      </span>
                    </div>
                    <div className="thin">
                      <i style={{ width: `${course.progress_percent}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </section>

      <section style={{ marginTop: 48 }}>
        <div className="section-head">
          <div>
            <h2 className="h2">Next for you</h2>
            <p>Based on courses you have open</p>
          </div>
          <Link className="link small" to="/courses">
            See catalog
          </Link>
        </div>
        {recommended.length === 0 ? (
          <p className="dim">No further courses to suggest.</p>
        ) : (
          <div className="grid">
            {recommended.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function ContinuePanel({ course }: { course: Course }) {
  const done = progressLessons(course.progress_percent, course.module_count)
  const index = lessonIndex(course.progress_percent, course.module_count)
  const module = course.course_modules?.[index]
  const lesson = module ? cleanLessonTitle(module.module_name) : null

  return (
    <Panel className="continue">
      <Cover
        title={stripEmoji(course.courses_name)}
        categoryLabel={course.category?.name}
        lessons={course.module_count}
        categorySlug={course.creator?.is_owner ? 'study-with-ayaz' : course.category?.slug}
        imageUrl={course.thumbnail_url || course.course_image}
      />
      <div className="cont-body">
        <div className="meta">Continue · {stripEmoji(course.courses_name)}</div>
        <h2 className="h2">
          {lesson?.counter ? `${lesson.counter} · ` : ''}
          {lesson?.title ?? stripEmoji(course.courses_name)}
        </h2>
        <div className="cont-count">
          <Counter done={done} total={course.module_count} />
        </div>
        <Ticks done={done} total={course.module_count} />
        <div>
          <Link className="btn btn-primary" to={`/learn/${course.slug}/${module?.id ?? 0}`}>
            <Play className="i-16" size={16} strokeWidth={1.5} aria-hidden />
            Resume
          </Link>
        </div>
      </div>
    </Panel>
  )
}