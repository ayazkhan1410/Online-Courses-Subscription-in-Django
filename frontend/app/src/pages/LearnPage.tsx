import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getCourse } from '@/api/courses'
import { enrollCourse, markLessonProgress } from '@/api/learning'
import type { Module } from '@/api/types'
import { Button, buttonClass } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Tabs } from '@/components/Tabs'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/cn'
import { lessonLabel, stripEmoji, stripHtml } from '@/lib/text'
import { useState } from 'react'

export default function LearnPage() {
  const { slug = '', lessonId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('lesson')
  const query = useQuery({
    queryKey: ['course', slug],
    queryFn: () => getCourse(slug),
    enabled: Boolean(slug),
  })
  const modules = query.data?.course_modules ?? []
  const requested = Number(lessonId || params.get('lesson') || 0)
  const current =
    modules.find((mod) => mod.id === requested) ??
    modules.find((mod) => !mod.is_locked) ??
    modules[0]
  usePageTitle(current ? stripEmoji(current.module_name) : 'Lesson')

  const enroll = useMutation({
    mutationFn: () => enrollCourse(slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] })
      toast.push('Enrolled')
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const complete = useMutation({
    mutationFn: (mod: Module) => markLessonProgress(mod.id, !mod.is_completed),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] })
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  if (query.isLoading) return <Skeleton className="m-6 h-80" />
  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const course = query.data
  const index = current ? modules.findIndex((mod) => mod.id === current.id) : 0

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-16 items-center justify-between border-b border-line px-4 md:px-6">
        <Link to="/" className="text-sm font-medium">
          Study with Ayaz
        </Link>
        <Link to={`/courses/${course.slug}`} className="text-sm text-ink-2">
          {stripEmoji(course.courses_name)}
        </Link>
      </header>
      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="p-4 md:p-6">
          {current ? (
            <p className="font-mono text-sm text-accent-ink">
              {lessonLabel(index, modules.length)}
            </p>
          ) : null}
          <h1 className="mt-2 text-[32px]">
            {current ? stripEmoji(current.module_name) : stripEmoji(course.courses_name)}
          </h1>
          {!course.is_enrolled ? (
            <Button className="mt-6" onClick={() => enroll.mutate()} disabled={!token || enroll.isPending}>
              Enroll
            </Button>
          ) : null}
          <div className="mt-6">
            <Tabs
              label="Lesson sections"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'lesson', label: 'Lesson' },
                { id: 'notes', label: 'Notes' },
              ]}
            />
          </div>
          {tab === 'notes' ? (
            <p className="mt-6 text-ink-2">Notes are not saved yet.</p>
          ) : current?.is_locked || !current?.embed_url ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-6">
              <p className="text-ink-2">
                {current?.is_locked
                  ? 'This lesson is locked until you enroll and, for premium courses, have Pro.'
                  : 'This lesson has no video yet.'}
              </p>
              {course.is_premium && current?.is_locked ? (
                <Link to="/pro" className={buttonClass('primary', 'md', 'mt-4')}>
                  See Pro
                </Link>
              ) : null}
            </div>
          ) : (
            <iframe
              className="mt-6 aspect-video w-full rounded-card border border-line"
              src={current.embed_url}
              title={stripEmoji(current.module_name)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {tab === 'lesson' && current && !current.is_locked ? (
            <div className="mt-6 max-w-2xl text-ink-2">
              {stripHtml(current.module_description)}
            </div>
          ) : null}
          {current && course.is_enrolled && !current.is_locked ? (
            <Button
              className="mt-6"
              variant="secondary"
              onClick={() => complete.mutate(current)}
              disabled={complete.isPending}
            >
              {current.is_completed ? 'Mark incomplete' : 'Mark complete'}
            </Button>
          ) : null}
        </div>
        <aside className="border-t border-line lg:sticky lg:top-0 lg:h-screen lg:overflow-auto lg:border-l lg:border-t-0">
          <ol>
            {modules.map((mod, modIndex) => (
              <li key={mod.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left',
                    current?.id === mod.id && 'bg-raised',
                  )}
                  onClick={() => navigate(`/learn/${slug}/${mod.id}`)}
                >
                  <span className="font-mono text-xs text-accent-ink">
                    {lessonLabel(modIndex, modules.length)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{stripEmoji(mod.module_name)}</span>
                    {mod.is_locked ? <span className="text-xs text-ink-3">Locked</span> : null}
                  </span>
                  {mod.thumbnail_url && !mod.is_locked ? (
                    <img
                      src={mod.thumbnail_url}
                      alt=""
                      className="h-12 w-20 rounded-notebook object-cover"
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  )
}
