import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  Check,
  ChevronRight,
  ExternalLink,
  Play,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getCourse } from '@/api/courses'
import { addWishlist, enrollCourse, removeWishlist } from '@/api/learning'
import { Counter, Ticks } from '@/components/Counter'
import { Cover } from '@/components/Cover'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { stripEmoji, stripHtml } from '@/lib/text'

const LESSON_PREVIEW = 14

function languageLabel(code: string): string {
  switch (code) {
    case 'ur':
      return 'Urdu'
    case 'hi':
      return 'Hindi'
    case 'ur-hi':
      return 'Urdu / Hindi'
    default:
      return 'English'
  }
}

function levelLabel(level: string | null | undefined): string {
  if (!level) return 'Beginner'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function creatorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export default function CourseDetailPage() {
  const { slug = '' } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showAllLessons, setShowAllLessons] = useState(false)

  const query = useQuery({
    queryKey: ['course', slug],
    queryFn: () => getCourse(slug),
    enabled: Boolean(slug),
  })
  usePageTitle(query.data ? stripEmoji(query.data.courses_name) : 'Course')

  const enroll = useMutation({
    mutationFn: () => enrollCourse(slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] })
      toast.push('Enrolled')
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const wishlist = useMutation({
    mutationFn: async (saved: boolean) => {
      if (saved) await removeWishlist(slug)
      else await addWishlist(slug)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] })
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  function requireAuth(action: () => void) {
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`)
      return
    }
    action()
  }

  const course = query.data
  const modules = course?.course_modules ?? []

  const progress = useMemo(() => {
    if (!course) return { done: 0, now: 0, nextTitle: '' }
    const done = modules.filter((m) => m.is_completed).length
    const now = modules.findIndex((m) => !m.is_completed && !m.is_locked)
    const active = now >= 0 ? now : Math.min(done, modules.length - 1)
    const next = modules[active]
    const nextTitle = next ? cleanLessonTitle(next.module_name).title : ''
    return { done, now: active, nextTitle }
  }, [course, modules])

  if (query.isLoading) {
    return (
      <main className="wrap">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64" />
      </main>
    )
  }
  if (query.isError) {
    return (
      <main className="wrap">
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </main>
    )
  }
  if (!course) {
    return (
      <main className="wrap">
        <EmptyState
          title="Course not found"
          body="That slug is not in the catalog."
          actionLabel="Browse courses"
          to="/courses"
        />
      </main>
    )
  }

  const title = stripEmoji(course.courses_name)
  const creatorName = course.creator?.is_owner ? 'Ayaz Khan' : course.creator?.name ?? 'Creator'
  const creatorMeta = course.creator?.is_owner
    ? 'Study with Ayaz on YouTube'
    : course.creator?.channel_url
      ? course.creator.name
      : course.attribution
  const resumeModule =
    modules.find((m) => !m.is_completed && !m.is_locked) ??
    modules.find((m) => !m.is_locked) ??
    modules[0]

  const visibleLessons = showAllLessons ? modules : modules.slice(0, LESSON_PREVIEW)
  const percent =
    course.module_count > 0 ? Math.round((progress.done / course.module_count) * 100) : 0

  return (
    <main className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/courses">Courses</Link>
        <ChevronRight className="i" size={14} strokeWidth={1.5} aria-hidden />
        {course.category ? (
          <>
            <Link to={`/categories/${course.category.slug}`}>{course.category.name}</Link>
            <ChevronRight className="i" size={14} strokeWidth={1.5} aria-hidden />
          </>
        ) : null}
        <span className="meta">{title}</span>
      </nav>

      <section className="c-head">
        <div className="c-copy">
          <h1 className="h1">{title}</h1>
          <p className="lead">{stripHtml(course.courses_description)}</p>
          <div className="creator" data-testid="course-attribution">
            <span className="avatar avatar-lg">{creatorInitials(creatorName)}</span>
            <div>
              <div style={{ color: 'var(--text)' }}>
                {course.creator?.is_owner ? 'By Ayaz' : creatorName}
              </div>
              <div className="meta">{creatorMeta}</div>
            </div>
          </div>
          <dl className="c-facts" style={{ margin: 0 }}>
            <div>
              <dt>Lessons</dt>
              <dd className="num">{course.module_count}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{languageLabel(course.language)}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{levelLabel(course.level)}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>Free</dd>
            </div>
          </dl>
          <div className="c-actions">
            {course.is_enrolled && resumeModule ? (
              <Link
                className="btn btn-primary btn-lg"
                to={`/learn/${course.slug}/${resumeModule.id}`}
              >
                {progress.done > 0 ? 'Continue learning' : 'Start course'}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => requireAuth(() => enroll.mutate())}
                disabled={enroll.isPending}
              >
                Enroll free
              </button>
            )}
            <button
              type="button"
              className="btn btn-lg btn-icon"
              style={{ width: 48 }}
              aria-label={course.is_wishlisted ? 'Remove from saved' : 'Save for later'}
              onClick={() => requireAuth(() => wishlist.mutate(course.is_wishlisted))}
              disabled={wishlist.isPending}
            >
              <Bookmark className="i" size={18} strokeWidth={1.5} />
            </button>
            {course.playlist_url ? (
              <a
                className="link small"
                href={course.playlist_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
              >
                Watch on YouTube
                <ExternalLink className="i-16" size={16} strokeWidth={1.5} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
        <Cover
          title={title}
          categoryLabel={course.category?.name}
          lessons={course.module_count}
          categorySlug={
            course.creator?.is_owner ? 'study-with-ayaz' : course.category?.slug
          }
          imageUrl={course.thumbnail_url || course.course_image}
        />
      </section>

      <section className="c-body">
        <div>
          <div className="section-head" style={{ margin: 0 }}>
            <h2 className="h2">Lessons</h2>
            {course.is_enrolled ? (
              <span className="meta">
                {progress.done} of {course.module_count} done
              </span>
            ) : (
              <span className="meta">{course.module_count} lessons</span>
            )}
          </div>
          {modules.length === 0 ? (
            <p className="dim">This course has no lessons yet.</p>
          ) : (
            <ol className="lessons">
              {visibleLessons.map((mod, index) => {
                const { counter, title: lessonTitle } = cleanLessonTitle(mod.module_name)
                const state =
                  mod.is_completed ? 'done' : mod.id === resumeModule?.id && course.is_enrolled ? 'now' : ''
                const num = counter
                  ? counter.replace(/^day\s+/i, 'Day ').replace(/^lesson\s+/i, 'Lesson ')
                  : `Lesson ${String(index + 1).padStart(2, '0')}`

                return (
                  <li key={mod.id} className={`lesson ${state}`.trim()}>
                    <span className="n">{num}</span>
                    {mod.is_locked ? (
                      <span className="t">{lessonTitle}</span>
                    ) : (
                      <Link className="t" to={`/learn/${course.slug}/${mod.id}`}>
                        {lessonTitle}
                      </Link>
                    )}
                    <span className="st">
                      {mod.is_completed ? (
                        <Check className="i-16" size={16} strokeWidth={2} aria-hidden />
                      ) : state === 'now' ? (
                        <span className="meta" style={{ color: 'var(--accent-ink)' }}>
                          Up next
                        </span>
                      ) : (
                        <Play className="i-16" size={16} strokeWidth={1.5} aria-hidden />
                      )}
                    </span>
                  </li>
                )
              })}
              {modules.length > LESSON_PREVIEW && !showAllLessons ? (
                <li className="more">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowAllLessons(true)}
                  >
                    Show all {course.module_count} lessons
                  </button>
                </li>
              ) : null}
            </ol>
          )}
        </div>

        <aside className="side">
          <Panel>
            <div className="progress-head">
              <Counter done={progress.done} total={course.module_count} />
              {course.is_enrolled ? <span className="meta">{percent}%</span> : null}
            </div>
            <Ticks done={progress.done} total={course.module_count} />
            {progress.nextTitle ? (
              <p className="small dim" style={{ margin: '12px 0 0' }}>
                Next up: {progress.nextTitle}
              </p>
            ) : null}
          </Panel>
          <Panel className="about">
            <h3>About this course</h3>
            <p>{stripHtml(course.courses_description)}</p>
          </Panel>
          <Panel>
            <div className="attr">
              <span className="avatar avatar-lg">{creatorInitials(creatorName)}</span>
              <p>
                {course.creator?.is_owner
                  ? 'This playlist is from the Study with Ayaz channel. Videos play from YouTube.'
                  : course.attribution || `Videos play from ${creatorName} on YouTube.`}
              </p>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  )
}