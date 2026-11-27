import { Link } from 'react-router-dom'
import type { Course } from '@/api/types'
import { Counter, Ticks } from '@/components/Counter'
import type { FeaturedRow } from '@/components/home/featuredPlayerUtils'
import { cleanLessonTitle } from '@/lib/lessonTitle'
import { stripEmoji } from '@/lib/text'
import { formatDuration } from '@/lib/youtubeThumb'

const CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const PLAY = (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
)

type FeaturedPlayerProps = {
  course: Course
  done: number
  total: number
  rows: FeaturedRow[]
  playHref: string
  ctaHref: string
  ctaLabel: string
  eyebrow: string
  headline: string
  body: string
}

function languageLabel(code: string | null | undefined): string {
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

export function FeaturedPlayer({
  course,
  done,
  total,
  rows,
  playHref,
  ctaHref,
  ctaLabel,
  eyebrow,
  headline,
  body,
}: FeaturedPlayerProps) {
  const thumb = course.thumbnail_url || course.course_image || ''
  const by = course.creator?.is_owner
    ? 'Study with Ayaz'
    : course.creator?.name || 'Creator'
  const sub = `${by} · ${languageLabel(course.language)}`

  return (
    <section className="home-feat">
      <div className="home-player" aria-label="Preview of a lesson in progress">
        <Link
          to={playHref}
          className="home-screen"
          aria-label={`Play ${stripEmoji(course.courses_name)}`}
        >
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" decoding="async" />
          ) : null}
          <span className="play" aria-hidden>
            {PLAY}
          </span>
        </Link>
        <div className="home-player-info">
          <Counter done={done} total={total} className="home-player-counter" />
          <div>
            <div className="home-player-ttl">
              {stripEmoji(course.courses_name)}
            </div>
            <div className="home-player-sub">{sub}</div>
          </div>
        </div>
        <Ticks done={done} total={total} className="home-player-ticks" />
        <ol className="home-player-list">
          {rows.map((row) => {
            const cleaned = cleanLessonTitle(row.module.module_name)
            const len = formatDuration(row.module.duration_seconds)
            return (
              <li key={row.module.id} className={row.state === 'todo' ? undefined : row.state}>
                <span className={`box${row.state === 'now' ? ' tick-now' : ''}`}>
                  {row.state === 'done' ? CHECK : null}
                </span>
                <span className="d">{cleaned.counter ?? 'Lesson'}</span>
                <span className="t">{cleaned.title}</span>
                {len ? <span className="d len">{len}</span> : null}
              </li>
            )
          })}
        </ol>
      </div>
      <div>
        <div className="home-eyebrow accent">{eyebrow}</div>
        <h2>{headline}</h2>
        <p>{body}</p>
        <Link className="btn btn-primary btn-lg" to={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
