import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getCourse } from '@/api/courses'
import { addWishlist, enrollCourse, removeWishlist } from '@/api/learning'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button, buttonClass } from '@/components/Button'
import { CourseCover } from '@/components/CourseCover'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageMain } from '@/components/PageHeader'
import { Progress } from '@/components/Progress'
import { Skeleton } from '@/components/Skeleton'
import { Tag } from '@/components/Tag'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { lessonIndex, lessonLabel, stripEmoji, stripHtml } from '@/lib/text'

export default function CourseDetailPage() {
  const { slug = '' } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
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

  if (query.isLoading) {
    return (
      <PageMain>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64" />
      </PageMain>
    )
  }
  if (query.isError) {
    return (
      <PageMain>
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </PageMain>
    )
  }
  const course = query.data
  if (!course) {
    return (
      <PageMain>
        <EmptyState
          title="Course not found"
          body="That slug is not in the catalog."
          actionLabel="Browse courses"
          to="/courses"
        />
      </PageMain>
    )
  }

  const title = stripEmoji(course.courses_name)
  const modules = course.course_modules ?? []
  const meta = course.is_enrolled
    ? lessonLabel(lessonIndex(course.progress_percent, course.module_count), course.module_count)
    : `${course.module_count} lessons`

  return (
    <PageMain>
      <Breadcrumbs
        items={[
          { label: 'Courses', to: '/courses' },
          { label: title },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1>{title}</h1>
            {course.is_premium ? <Tag>Pro</Tag> : null}
          </div>
          <p className="mt-3 font-mono text-sm text-accent-ink">{meta}</p>
          <p className="mt-6 max-w-2xl text-ink-2">{stripHtml(course.courses_description)}</p>
          {course.is_enrolled ? (
            <div className="mt-6">
              <Progress value={course.progress_percent} />
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {course.is_enrolled ? (
              <Link to={`/learn/${course.slug}/${(course.course_modules.find((m) => !m.is_locked) ?? course.course_modules[0])?.id ?? 0}`} className={buttonClass('primary')}>
                Resume
              </Link>
            ) : (
              <Button onClick={() => requireAuth(() => enroll.mutate())} disabled={enroll.isPending}>
                Enroll
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => requireAuth(() => wishlist.mutate(course.is_wishlisted))}
              disabled={wishlist.isPending}
            >
              {course.is_wishlisted ? 'Remove saved' : 'Save'}
            </Button>
          </div>
        </div>
        <CourseCover title={title} meta={meta} />
      </div>
      <h2 className="mt-12">Lessons</h2>
      {modules.length === 0 ? (
        <p className="mt-4 text-ink-2">This course has no lessons yet.</p>
      ) : (
        <ol className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
          {modules.map((mod, index) => (
            <li key={mod.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-mono text-sm text-accent-ink">
                  {lessonLabel(index, modules.length)}
                </p>
                <p>{stripEmoji(mod.module_name)}</p>
              </div>
              {mod.is_locked ? (
                <Link to="/pro" className="text-sm text-ink-2">
                  Locked
                </Link>
              ) : (
                <Link to={`/learn/${course.slug}/${mod.id}`} className="text-sm">
                  Open
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </PageMain>
  )
}
