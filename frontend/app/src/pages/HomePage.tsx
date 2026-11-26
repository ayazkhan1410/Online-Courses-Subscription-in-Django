import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCourses } from '@/api/courses'
import { formatApiError } from '@/api/client'
import { buttonClass } from '@/components/Button'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { HeroCanvas } from '@/features/hero/HeroCanvas'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function HomePage() {
  usePageTitle('Courses')
  const query = useQuery({
    queryKey: ['courses', '', 1],
    queryFn: () => getCourses({ page: 1 }),
  })

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
        <div>
          <h1>Learn at the desk, then use it</h1>
          <p className="mt-4 max-w-md text-lg text-ink-2">
            Programming and freelance practice, one lesson at a time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/courses" className={buttonClass('primary')}>
              Browse courses
            </Link>
            <Link to="/contact" className={buttonClass('secondary')}>
              Hire me
            </Link>
          </div>
        </div>
        <HeroCanvas />
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
        <h2>How a lesson works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Pick a course', 'Open the catalog and enroll. Premium courses need Pro.'],
            ['Watch the lesson', 'The player keeps the video and the lesson list together.'],
            ['Mark it complete', 'Progress is saved on your account.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-card border border-line bg-surface p-5">
              <h3 className="text-xl">{title}</h3>
              <p className="mt-3 text-sm text-ink-2">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 md:px-6 md:pb-24">
        <h2>From the catalog</h2>
        <div className="mt-8">
          {query.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : null}
          {query.isError ? (
            <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
          ) : null}
          {query.data && query.data.results.length === 0 ? (
            <EmptyState
              title="No courses yet"
              body="The catalog is empty right now."
              actionLabel="Contact"
              to="/contact"
            />
          ) : null}
          {query.data && query.data.results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {query.data.results.slice(0, 4).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6">
          <h2>Start with a free lesson</h2>
          <Link to="/register" className={buttonClass('primary')}>
            Create account
          </Link>
        </div>
      </section>
    </>
  )
}
