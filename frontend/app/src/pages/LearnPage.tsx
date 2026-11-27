import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiBase, formatApiError } from '@/api/client'
import { getCourse } from '@/api/courses'
import { enrollCourse, markLessonProgress, saveLessonPosition } from '@/api/learning'
import type { Module } from '@/api/types'
import { Counter, Ticks } from '@/components/Counter'
import { ErrorState } from '@/components/ErrorState'
import { LessonList } from '@/components/LessonList'
import { Skeleton } from '@/components/Skeleton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { computeResumeSeconds, formatClock } from '@/lib/resume'
import { stripEmoji } from '@/lib/text'

function videoIdFromModule(mod: Module | undefined): string | null {
  if (!mod || mod.is_locked) return null
  const direct = (mod.youtube_video_id || '').trim()
  if (direct) return direct
  const embed = mod.embed_url || ''
  const match = embed.match(/\/embed\/([^?/]+)/)
  return match?.[1] ?? null
}

function persistPosition(moduleId: number, seconds: number, token: string | null) {
  if (!token) return
  const body = JSON.stringify({
    module_id: moduleId,
    seconds: Math.max(0, Math.floor(seconds)),
  })
  void fetch(`${apiBase()}/learning/progress/position/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    keepalive: true,
  })
}

export default function LearnPage() {
  const { slug = '', lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'notes' | 'about'>('notes')
  const playerHostRef = useRef<HTMLDivElement>(null)
  const lastSavedRef = useRef(0)
  const [resumeBanner, setResumeBanner] = useState<{ at: number } | null>(null)
  const [startOverNonce, setStartOverNonce] = useState(0)

  const query = useQuery({
    queryKey: ['course', slug],
    queryFn: () => getCourse(slug),
    enabled: Boolean(slug),
  })

  const modules = query.data?.course_modules ?? []
  const requested = Number(lessonId || 0)
  const current =
    modules.find((mod) => mod.id === requested) ??
    modules.find((mod) => !mod.is_locked) ??
    modules[0]

  const { counter, title: lessonTitle } = cleanLessonTitle(current?.module_name)
  usePageTitle(current ? lessonTitle : 'Lesson')

  const tParam = Number(searchParams.get('t') || '')
  const savedPosition = current?.position_seconds ?? 0
  const startSeconds = useMemo(() => {
    if (startOverNonce > 0) return 0
    if (Number.isFinite(tParam) && tParam > 0) return Math.floor(tParam)
    return computeResumeSeconds(savedPosition, current?.duration_seconds)
  }, [current?.duration_seconds, savedPosition, startOverNonce, tParam])

  useEffect(() => {
    setStartOverNonce(0)
    if (Number.isFinite(tParam) && tParam > 0) {
      setResumeBanner(null)
      return
    }
    const resumeAt = computeResumeSeconds(savedPosition, current?.duration_seconds)
    setResumeBanner(resumeAt > 0 ? { at: resumeAt } : null)
  }, [current?.id, current?.duration_seconds, savedPosition, tParam])

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

  const savePos = useCallback(
    async (modId: number, seconds: number, force = false) => {
      const now = Date.now()
      if (!force && now - lastSavedRef.current < 14_000) return
      lastSavedRef.current = now
      try {
        const result = await saveLessonPosition(modId, seconds)
        if (result.completed) {
          await queryClient.invalidateQueries({ queryKey: ['course', slug] })
        }
      } catch {
        /* ignore transient save errors while watching */
      }
    },
    [queryClient, slug],
  )

  const canPlay = Boolean(
    query.data?.is_enrolled && current && !current.is_locked && videoIdFromModule(current),
  )
  const videoId = canPlay ? videoIdFromModule(current) : null

  const player = useYouTubePlayer(playerHostRef, {
    videoId,
    enabled: canPlay,
    startSeconds,
    onTime: (seconds, duration) => {
      if (!current) return
      void savePos(current.id, seconds)
      if (duration > 0 && seconds >= duration * 0.9 && !current.is_completed) {
        void markLessonProgress(current.id, true).then(() =>
          queryClient.invalidateQueries({ queryKey: ['course', slug] }),
        )
      }
    },
    onPause: (seconds) => {
      if (!current) return
      void savePos(current.id, seconds, true)
    },
  })

  useEffect(() => {
    if (!token) navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`)
  }, [token, navigate])

  useEffect(() => {
    if (!current || !token) return
    const onHide = () => {
      const seconds = player?.getCurrentTime() ?? 0
      if (seconds > 0) persistPosition(current.id, seconds, token)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
    }
  }, [current, player, token])

  if (query.isLoading) {
    return <Skeleton className="m-6 h-80" />
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const course = query.data
  const index = current ? modules.findIndex((mod) => mod.id === current.id) : 0
  const done = modules.filter((mod) => mod.is_completed).length
  const prev = index > 0 ? modules[index - 1] : null
  const next = index < modules.length - 1 ? modules[index + 1] : null
  const dayLabel =
    counter?.replace(/^day\s+/i, 'Day ') ??
    `Lesson ${String(index + 1).padStart(2, '0')} of ${course.module_count}`

  return (
    <>
      <header className="topbar">
        <Link
          className="btn btn-ghost btn-icon"
          to={`/courses/${course.slug}`}
          aria-label="Back to course"
        >
          <ChevronLeft className="i" size={18} strokeWidth={1.5} />
        </Link>
        <div className="title">{stripEmoji(course.courses_name)}</div>
        <div className="prog">
          <Counter done={done} total={course.module_count} className="small" />
          <Ticks done={done} total={course.module_count} />
        </div>
        <ThemeToggle />
      </header>

      <div className="shell">
        <main className="main">
          <div className="player">
            {canPlay ? (
              <div
                ref={playerHostRef}
                data-testid="yt-player"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            ) : null}
            <span className="player-note">Plays from YouTube</span>
          </div>

          {resumeBanner ? (
            <p className="dim small" style={{ marginTop: 12 }} data-testid="resume-banner">
              Resumed at {formatClock(resumeBanner.at)}.{' '}
              <button
                type="button"
                className="link"
                onClick={() => {
                  setResumeBanner(null)
                  setStartOverNonce((n) => n + 1)
                  player?.seekTo(0)
                }}
              >
                Start over
              </button>
            </p>
          ) : null}

          {!course.is_enrolled ? (
            <div className="l-head">
              <p className="dim">Enroll to watch this playlist.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => enroll.mutate()}
                disabled={!token || enroll.isPending}
              >
                Enroll
              </button>
            </div>
          ) : null}

          <div className="l-head">
            <div>
              <div className="meta">{dayLabel}</div>
              <h1 className="h2">{lessonTitle}</h1>
            </div>
            <div className="l-actions">
              <button
                type="button"
                className="btn btn-icon"
                aria-label="Previous lesson"
                disabled={!prev || prev.is_locked}
                onClick={() => prev && navigate(`/learn/${slug}/${prev.id}`)}
              >
                <ChevronLeft className="i" size={18} strokeWidth={1.5} />
              </button>
              {current && !current.is_locked ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(current)}
                >
                  <Check className="i-16" size={16} strokeWidth={2} aria-hidden />
                  {current.is_completed ? 'Completed' : 'Mark complete'}
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-icon"
                aria-label="Next lesson"
                disabled={!next || next.is_locked}
                onClick={() => next && navigate(`/learn/${slug}/${next.id}`)}
              >
                <ChevronRight className="i" size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="tabs2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'notes'}
              onClick={() => setTab('notes')}
            >
              Notes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'about'}
              onClick={() => setTab('about')}
            >
              About
            </button>
          </div>
          <div className="notes-wrap">
            {tab === 'notes' ? (
              <>
                <textarea
                  className="notes"
                  aria-label="Your notes"
                  placeholder="Notes are not saved yet."
                  readOnly
                />
                <div className="notes-foot">
                  <span className="meta">Only you can see your notes</span>
                </div>
              </>
            ) : (
              <p className="dim" style={{ padding: '16px 0' }}>
                {course.attribution || 'Course videos play from YouTube.'}
              </p>
            )}
          </div>
        </main>

        <LessonList slug={course.slug} modules={modules} currentId={current?.id} />
      </div>
    </>
  )
}
