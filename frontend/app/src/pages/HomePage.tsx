import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCategory, listCategories } from '@/api/categories'
import { ApiError, formatApiError } from '@/api/client'
import { getCourses } from '@/api/courses'
import { buttonClass } from '@/components/Button'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { HeroCanvas } from '@/features/hero/HeroCanvas'
import { usePageTitle } from '@/hooks/usePageTitle'

const AYAZ = 'study-with-ayaz'

export default function HomePage() {
  usePageTitle('Courses')
  const ayaz = useQuery({
    queryKey: ['category', AYAZ],
    queryFn: () => getCategory(AYAZ),
  })
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })
  const courses = useQuery({
    queryKey: ['courses', 'home'],
    queryFn: () => getCourses({ page: 1 }),
  })

  const ayazMissing = ayaz.error instanceof ApiError && ayaz.error.status === 404
  const ayazCourses = ayaz.data?.results ?? []
  const featured = (courses.data?.results ?? [])
    .filter((course) => course.category?.slug !== AYAZ)
    .slice(0, 4)
  const featuredCourses = featured.length > 0 ? featured : (courses.data?.results ?? []).slice(0, 4)

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
        <h2>{ayaz.data?.category.name ?? 'Study with Ayaz'}</h2>
        {ayaz.data?.category.description ? (
          <p className="mt-3 max-w-2xl text-ink-2">{ayaz.data.category.description}</p>
        ) : null}
        <div className="mt-8">
          {ayaz.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : null}
          {ayaz.isError && !ayazMissing ? (
            <ErrorState message={formatApiError(ayaz.error)} onRetry={() => void ayaz.refetch()} />
          ) : null}
          {ayazMissing || (ayaz.data && ayazCourses.length === 0) ? (
            <EmptyState
              title="No courses in this category"
              body="Study with Ayaz playlists are not published yet."
              actionLabel="Browse courses"
              to="/courses"
            />
          ) : null}
          {ayazCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {ayazCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
        <h2>Categories</h2>
        <div className="mt-8">
          {categories.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : null}
          {categories.isError ? (
            <ErrorState
              message={formatApiError(categories.error)}
              onRetry={() => void categories.refetch()}
            />
          ) : null}
          {categories.data && categories.data.length === 0 ? (
            <EmptyState
              title="No categories yet"
              body="The catalog has no categories to browse."
              actionLabel="Contact"
              to="/contact"
            />
          ) : null}
          {categories.data && categories.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.data.map((item) => (
                <Link
                  key={item.slug}
                  to={`/categories/${item.slug}`}
                  className="rounded-card border border-line bg-surface p-5 transition-colors duration-200 ease-swa hover:border-line-strong"
                >
                  <CategoryGlyph icon={item.icon} slug={item.slug} />
                  <h3 className="mt-4 text-xl">{item.name}</h3>
                  <p className="mt-2 font-mono text-xs text-ink-3">
                    {item.published_course_count} courses
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
        <h2>Featured</h2>
        <div className="mt-8">
          {courses.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : null}
          {courses.isError ? (
            <ErrorState message={formatApiError(courses.error)} onRetry={() => void courses.refetch()} />
          ) : null}
          {courses.data && featuredCourses.length === 0 ? (
            <EmptyState
              title="No courses yet"
              body="The catalog is empty right now."
              actionLabel="Contact"
              to="/contact"
            />
          ) : null}
          {featuredCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-24">
          <div>
            <h2>Freelance work</h2>
            <p className="mt-3 max-w-xl text-ink-2">
              Project help sits beside the course library.
            </p>
          </div>
          <Link to="/services" className={buttonClass('primary')}>
            See services
          </Link>
        </div>
      </section>
    </>
  )
}
