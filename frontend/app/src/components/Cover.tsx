import { useState } from 'react'
import { cn } from '@/lib/cn'
import { coverShortTitle, inkClass } from '@/lib/ink'

export function Cover({
  title,
  categoryLabel,
  lessons,
  categorySlug,
  byline,
  imageUrl,
  compact = false,
  className,
}: {
  title: string
  categoryLabel?: string | null
  lessons?: number | null
  categorySlug?: string | null
  byline?: string | null
  imageUrl?: string | null
  compact?: boolean
  className?: string
}) {
  const lessonText =
    lessons == null
      ? null
      : lessons === 1
        ? '1 lesson'
        : `${lessons} lessons`
  const shortTitle = coverShortTitle(title)
  const [thumbFailed, setThumbFailed] = useState(false)

  if (compact) {
    return (
      <div
        className={cn(
          'cover cover-compact',
          inkClass(categorySlug),
          className,
        )}
      >
        <div className="cover-title">{shortTitle}</div>
      </div>
    )
  }

  const thumb = (imageUrl || '').trim()
  if (thumb && !thumbFailed) {
    return (
      <div className={cn('cover cover-media', inkClass(categorySlug), className)}>
        <img
          src={thumb}
          alt=""
          className="cover-thumb"
          loading="lazy"
          onError={() => setThumbFailed(true)}
        />
        {/* The thumbnail already shows the title; keep only the lesson count. */}
        {lessonText ? <span className="cover-count">{lessonText}</span> : null}
      </div>
    )
  }
  return (
    <div className={cn('cover', inkClass(categorySlug), className)}>
      <div className="cover-top">
        <span>{categoryLabel || 'Course'}</span>
        {lessonText ? <span>{lessonText}</span> : <span />}
      </div>
      <div className="cover-title">{shortTitle}</div>
      {byline ? <div className="cover-by">{byline}</div> : null}
    </div>
  )
}
