import { useQuery } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getCategory } from '@/api/categories'
import { ApiError, formatApiError } from '@/api/client'
import { getConfig } from '@/api/config'
import { getCourse, getCourses } from '@/api/courses'
import { getDashboard } from '@/api/learning'
import { listPaths } from '@/api/paths'
import type { Course, LearningPath } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ThumbCard } from '@/components/ThumbCard'
import { FeaturedPlayer } from '@/components/home/FeaturedPlayer'
import {
  dayNumberLabel,
  demoFeaturedRows,
  liveFeaturedRows,
} from '@/components/home/featuredPlayerUtils'
import { ThumbnailWall } from '@/components/home/ThumbnailWall'
import { Skeleton } from '@/components/Skeleton'
import { Ticks } from '@/components/Counter'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useReveal } from '@/hooks/useReveal'
import { PAGE_DESCRIPTIONS } from '@/lib/pageDescriptions'
import { formatCount, mqThumb } from '@/lib/youtubeThumb'

const AYAZ = 'study-with-ayaz'
const FEATURED_SLUG = '50-days-of-python-programming-challenge'

function Reveal({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function progressDone(percent: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(total, Math.round((percent / 100) * total))
}

export default function HomePage() {
  usePageTitle('Study with Ayaz', {
    description: PAGE_DESCRIPTIONS.home,
    canonicalPath: '/',
  })
  const { token } = useAuth()
  const loggedIn = Boolean(token)

  const config = useQuery({ queryKey: ['config'], queryFn: getConfig })
  const ayaz = useQuery({
    queryKey: ['category', AYAZ],
    queryFn: () => getCategory(AYAZ),
  })
  const courses = useQuery({
    queryKey: ['courses', 'home'],
    queryFn: () => getCourses({ page: 1 }),
  })
  const paths = useQuery({ queryKey: ['paths'], queryFn: listPaths })
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: loggedIn,
  })

  const continueBrief = dashboard.data?.continue_learning[0]
  const continueSlug = continueBrief?.slug
  const continueDetail = useQuery({
    queryKey: ['course', continueSlug, 'home-featured'],
    queryFn: () => getCourse(continueSlug!),
    enabled: loggedIn && Boolean(continueSlug),
  })

  const featured = useQuery({
    queryKey: ['course', FEATURED_SLUG, 'home-demo'],
    queryFn: () => getCourse(FEATURED_SLUG),
    enabled: !loggedIn || (!continueSlug && !dashboard.isLoading),
  })

  const ayazMissing = ayaz.error instanceof ApiError && ayaz.error.status === 404
  const ayazCourses = useMemo(
    () => ayaz.data?.results ?? [],
    [ayaz.data?.results],
  )
  const ayazCount =
    ayaz.data?.category.published_course_count ?? ayaz.data?.count ?? ayazCourses.length

  const popular = useMemo(() => {
    const all = courses.data?.results ?? []
    const thirdParty = all.filter(
      (c) => c.category?.slug !== AYAZ && !c.creator?.is_owner,
    )
    const list = thirdParty.length > 0 ? thirdParty : all
    return list.slice(0, 8)
  }, [courses.data?.results])

  const wallUrls = useMemo(() => {
    const pool: Course[] = [...ayazCourses, ...popular]
    const urls = pool
      .map((c) => c.thumbnail_url || c.course_image || '')
      .filter(Boolean)
    if (urls.length >= 6) return urls
    const extra = (courses.data?.results ?? [])
      .map((c) => c.thumbnail_url || c.course_image || '')
      .filter(Boolean)
    return [...urls, ...extra].slice(0, 16)
  }, [ayazCourses, popular, courses.data?.results])

  const courseCount = config.data?.published_course_count ?? courses.data?.count ?? 0
  const creatorCount = config.data?.creator_count ?? 0
  const lessonCount = config.data?.lesson_count ?? 0
  const pathCount = config.data?.path_count ?? paths.data?.length ?? 0
  const languageCount = config.data?.language_count ?? 0

  const pathCards = (paths.data ?? []).slice(0, 3)

  const useContinue =
    loggedIn && Boolean(continueBrief) && Boolean(continueDetail.data)
  const playerCourse = useContinue
    ? continueDetail.data!
    : featured.data
  const playerModules = playerCourse?.course_modules ?? []

  let featuredBlock: ReactNode = null
  if (playerCourse && playerModules.length > 0) {
    if (useContinue) {
      const total = playerCourse.module_count || playerModules.length
      const done = progressDone(
        continueBrief?.progress_percent ?? playerCourse.progress_percent,
        total,
      )
      const { nextIndex, rows } = liveFeaturedRows(playerModules, done)
      const next = playerModules[nextIndex]
      const dayN = dayNumberLabel(next, nextIndex + 1)
      const playHref = `/learn/${playerCourse.slug}/${next?.id ?? 0}`
      featuredBlock = (
        <FeaturedPlayer
          course={playerCourse}
          done={done}
          total={total}
          rows={rows}
          playHref={playHref}
          ctaHref={playHref}
          ctaLabel={`Continue day ${dayN}`}
          eyebrow="Pick up where you left off"
          headline={stripShort(playerCourse.courses_name)}
          body="Your progress is saved. Jump back in and tick off the next lesson."
        />
      )
    } else {
      const total = playerCourse.module_count || playerModules.length || 50
      const { done, rows } = demoFeaturedRows(playerModules)
      const first = playerModules[0]
      const playHref = `/learn/${playerCourse.slug}/${first?.id ?? 0}`
      featuredBlock = (
        <FeaturedPlayer
          course={playerCourse}
          done={Math.min(done, total)}
          total={total}
          rows={rows}
          playHref={playHref}
          ctaHref={playHref}
          ctaLabel="Start day 1"
          eyebrow="Most people start here"
          headline="50 Days of Python. One lesson a day."
          body="My own course in Urdu and Hindi. Ten minutes a day, and in seven weeks you're writing real programs. Tick off each lesson, and next time you open the site it starts right where you stopped."
        />
      )
    }
  }

  const eyebrow =
    courseCount > 0
      ? `${formatCount(courseCount)} free courses${
          creatorCount > 0 ? ` · ${formatCount(creatorCount)} teachers` : ''
        }`
      : 'Free coding courses'

  return (
    <div className="home">
      <section className="home-hero">
        <ThumbnailWall urls={wallUrls} />
        <div className="home-scrim" aria-hidden="true" />
        <div className="wrap">
          <div className="home-hero-in">
            <div className="home-eyebrow">{eyebrow}</div>
            <h1>Learn to code from YouTube&apos;s best teachers. In order.</h1>
            <p>
              I picked the clearest playlists on Python, Django, React, DSA and AI,
              sorted them into paths, and added progress tracking for every lesson.
              Free, forever.
            </p>
            <div className="home-cta">
              <Link className="btn btn-lg btn-light" to="/courses">
                Browse courses
              </Link>
              <Link
                className="btn btn-lg btn-outline-light"
                to={`/courses/${FEATURED_SLUG}`}
              >
                Start the Python challenge
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="wrap home-main">
        <Reveal className="home-band">
          <div>
            <b>{courseCount > 0 ? formatCount(courseCount) : '—'}</b>
            <span>free courses</span>
          </div>
          <div>
            <b>{lessonCount > 0 ? formatCount(lessonCount) : '—'}</b>
            <span>lessons, all tracked</span>
          </div>
          <div>
            <b>{pathCount > 0 ? formatCount(pathCount) : '—'}</b>
            <span>learning paths</span>
          </div>
          <div>
            <b>{languageCount > 0 ? formatCount(languageCount) : '—'}</b>
            <span>languages: Urdu, Hindi, English</span>
          </div>
        </Reveal>

        <Reveal>
          {featuredBlock ?? (
            <div className="home-feat home-feat-loading">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          )}
        </Reveal>

        <div className="home-rows">
          <Reveal className="home-row-block">
            <div className="home-row-head">
              <h2>My courses</h2>
              {ayazCount > 0 ? (
                <Link className="link" to={`/categories/${AYAZ}`}>
                  See all {ayazCount}
                </Link>
              ) : null}
            </div>
            <div className="home-rail">
              {ayaz.isLoading ? (
                <>
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </>
              ) : null}
              {ayaz.isError && !ayazMissing ? (
                <ErrorState
                  message={formatApiError(ayaz.error)}
                  onRetry={() => void ayaz.refetch()}
                />
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
                <ThumbCard key={course.id} course={course} />
              ))}
            </div>
          </Reveal>

          <Reveal className="home-row-block">
            <div className="home-row-head">
              <h2>Popular from other teachers</h2>
              <Link className="link" to="/courses">
                Browse all
              </Link>
            </div>
            <div className="home-rail">
              {courses.isLoading ? (
                <>
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </>
              ) : null}
              {courses.isError ? (
                <ErrorState
                  message={formatApiError(courses.error)}
                  onRetry={() => void courses.refetch()}
                />
              ) : null}
              {popular.map((course) => (
                <ThumbCard key={course.id} course={course} />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="home-steps-sec">
          <h2>How it works</h2>
          <div className="home-steps">
            <div className="home-step">
              <div className="n">01</div>
              <h3>Pick what to learn</h3>
              <p>Choose a topic, a teacher or a language, or follow a ready-made path.</p>
              <div className="demo">
                <div className="chipset">
                  <span>Python</span>
                  <span className="on">Django</span>
                  <span>React</span>
                  <span>Urdu / Hindi</span>
                </div>
              </div>
            </div>
            <div className="home-step">
              <div className="n">02</div>
              <h3>Watch here, from YouTube</h3>
              <p>Every video plays from the creator&apos;s channel. Take notes at any second.</p>
              <div className="demo">
                <span className="mono small dim">
                  04:12 &nbsp;list slicing starts at index 0
                </span>
              </div>
            </div>
            <div className="home-step">
              <div className="n">03</div>
              <h3>Tick it off, come back</h3>
              <p>Your progress is saved. Next time you start right where you stopped.</p>
              <div className="demo" style={{ width: '100%' }}>
                <Ticks done={12} total={30} className="home-demo-ticks" />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="home-paths-sec">
          <h2>Don&apos;t know what to watch next? Follow a path.</h2>
          <div className="home-paths">
            {paths.isLoading ? (
              <>
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </>
            ) : null}
            {pathCards.map((path) => (
              <PathCard key={path.slug} path={path} />
            ))}
          </div>
        </Reveal>

        <Reveal className="home-close">
          <h2>Pick a course. Press play. Come back tomorrow.</h2>
          {loggedIn ? (
            <Link className="btn btn-primary btn-lg" to="/courses">
              Browse courses
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" to="/register">
              Create a free account
            </Link>
          )}
        </Reveal>
      </main>
    </div>
  )
}

function stripShort(name: string): string {
  const t = name.replace(/\s+/g, ' ').trim()
  return t.length > 48 ? `${t.slice(0, 45).trim()}…` : t
}

function PathCard({ path }: { path: LearningPath }) {
  const thumbs = (path.steps ?? [])
    .slice(0, 3)
    .map((s) => mqThumb(s.course.thumbnail || ''))
    .filter(Boolean)

  return (
    <Link to={`/paths/${path.slug}`} className="home-path">
      <div className="home-stack">
        {thumbs.map((src, i) => (
          <img key={`${path.slug}-${i}`} src={src} alt="" loading="lazy" decoding="async" />
        ))}
      </div>
      <div>
        <h3>{path.title}</h3>
        <div className="lvl">{path.level}</div>
      </div>
    </Link>
  )
}
