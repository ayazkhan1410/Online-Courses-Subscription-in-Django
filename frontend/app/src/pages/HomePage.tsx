import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCategory, listCategories } from '@/api/categories'
import { ApiError, formatApiError } from '@/api/client'
import { getCourses } from '@/api/courses'
import { CategoryGlyph } from '@/components/CategoryGlyph'
import { CourseCard } from '@/components/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { DeskScene } from '@/features/hero/DeskScene'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'
import { inkClass } from '@/lib/ink'

const AYAZ = 'study-with-ayaz'

export default function HomePage() {
  usePageTitle('Study with Ayaz', {
    description: PAGE_DESCRIPTIONS.home,
    canonicalPath: '/',
  })
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
  const ayazCount =
    ayaz.data?.category.published_course_count ?? ayaz.data?.count ?? ayazCourses.length
  const totalCourses = courses.data?.count ?? 0
  const categoryCount = categories.data?.length ?? 0
  const ownerCourses = categories.data?.find((c) => c.slug === AYAZ)?.published_course_count ?? ayazCount

  const featured = (courses.data?.results ?? [])
    .filter((course) => course.category?.slug !== AYAZ && !course.creator?.is_owner)
    .slice(0, 4)
  const featuredCourses =
    featured.length > 0 ? featured : (courses.data?.results ?? []).slice(0, 4)

  const heroCourse =
    ayazCourses[0]?.slug
      ? `/courses/${ayazCourses[0].slug}`
      : '/categories/python'

  return (
  <>
    <section className="wrap hero">
      <div className="hero-copy">
        <h1 className="h-display">
          Free coding courses from YouTube, in an order you can finish
        </h1>
        <p className="lead">
          I pick the clearest playlists on Python, Django, React and more, sort them by topic,
          and keep track of every lesson you watch. Nothing to pay.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-lg" to="/courses">
            Browse courses
          </Link>
          <Link className="btn btn-lg" to={heroCourse}>
            Start the Python challenge
          </Link>
        </div>
        <div className="hero-facts meta">
          {totalCourses > 0 ? (
            <span>
              <b>{totalCourses}</b> courses
            </span>
          ) : null}
          {categoryCount > 0 ? (
            <span>
              <b>{categoryCount}</b> categories
            </span>
          ) : null}
          {ownerCourses > 0 ? (
            <span>
              <b>{ownerCourses}</b> taught by me
            </span>
          ) : null}
        </div>
      </div>
      <DeskScene />
    </section>

    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2 className="h2">My courses</h2>
            <p>
              Recorded in Urdu and Hindi, with notes. Python, Java and tools for students.
            </p>
          </div>
          {ayazCount > 0 ? (
            <Link className="link small" to={`/categories/${AYAZ}`}>
              All {ayazCount}
            </Link>
          ) : null}
        </div>
        <div className="row-scroll">
          {ayaz.isLoading ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </>
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
          {ayazCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>

    <section className="section" id="categories">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2 className="h2">Categories</h2>
            <p>Each one holds playlists I&apos;ve watched and would recommend.</p>
          </div>
        </div>
        {categories.isLoading ? (
          <div className="cats">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : null}
        {categories.isError ? (
          <ErrorState
            message={formatApiError(categories.error)}
            onRetry={() => void categories.refetch()}
          />
        ) : null}
        {categories.data && categories.data.length > 0 ? (
          <div className="cats">
            {categories.data.map((item) => {
              const cover = (item.cover_image_url || '').trim()
              return (
                <Link
                  key={item.slug}
                  to={`/categories/${item.slug}`}
                  className={`cat${item.slug === AYAZ ? ' owner' : ''}${cover ? ' cat-media' : ''} ${inkClass(item.slug)}`}
                >
                  {cover ? (
                    <img src={cover} alt="" className="cat-thumb" loading="lazy" />
                  ) : null}
                  <div className="cat-body">
                    <div className="cat-top">
                      <CategoryGlyph icon={item.icon} slug={item.slug} />
                      <span className="cat-count meta">{item.published_course_count}</span>
                    </div>
                    <h3 className="h3">{item.name}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>

    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2 className="h2">From other teachers</h2>
            <p>Picked from creators who explain well. Every video plays from their channel.</p>
          </div>
          <Link className="link small" to="/courses">
            All courses
          </Link>
        </div>
        {courses.isLoading ? (
          <div className="grid">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : null}
        {courses.isError ? (
          <ErrorState message={formatApiError(courses.error)} onRetry={() => void courses.refetch()} />
        ) : null}
        {featuredCourses.length > 0 ? (
          <div className="grid">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses yet"
            body="The catalog is empty right now."
            actionLabel="Contact"
            to="/contact"
          />
        )}
      </div>
    </section>

    <section className="section">
      <div className="wrap">
        <div className="panel work">
          <div>
            <h2 className="h2">I also build software for clients</h2>
            <p className="dim" style={{ margin: '12px 0 24px' }}>
              Backend APIs, dashboards and full products with Django and React. The site
              you&apos;re on is one of them.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/services">
                See services
              </Link>
              <Link className="btn btn-ghost" to="/contact">
                Contact me
              </Link>
            </div>
          </div>
          <ul>
            <li>
              <span>Django and DRF APIs</span>
              <span className="meta">backend</span>
            </li>
            <li>
              <span>React frontends and dashboards</span>
              <span className="meta">frontend</span>
            </li>
            <li>
              <span>Docker deploys and CI</span>
              <span className="meta">devops</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </>
  )
}