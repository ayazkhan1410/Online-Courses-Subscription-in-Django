import { cn } from '@/lib/cn'
import { coverShortTitle, inkClass } from '@/lib/ink'

export function Cover({
  title,
  categoryLabel,
  lessons,
  categorySlug,
  byline,
  imageUrl,
  className,
}: {
  title: string
  categoryLabel?: string | null
  lessons?: number | null
  categorySlug?: string | null
  byline?: string | null
  imageUrl?: string | null
  className?: string
}) {
  const lessonText =
    lessons == null
      ? null
      : lessons === 1
        ? '1 lesson'
        : `${lessons} lessons`
  const thumb = (imageUrl || '').trim()
  if (thumb) {
    return (
      <div className={cn('cover cover-media', inkClass(categorySlug), className)}>
        <img src={thumb} alt="" className="cover-thumb" loading="lazy" />
        <div className="cover-scrim" aria-hidden="true" />
        <div className="cover-top">
          <span>{categoryLabel || 'Course'}</span>
          {lessonText ? <span>{lessonText}</span> : <span />}
        </div>
        <div className="cover-title">{coverShortTitle(title)}</div>
        {byline ? <div className="cover-by">{byline}</div> : null}
      </div>
    )
  }
  return (
    <div className={cn('cover', inkClass(categorySlug), className)}>
      <div className="cover-top">
        <span>{categoryLabel || 'Course'}</span>
        {lessonText ? <span>{lessonText}</span> : <span />}
      </div>
      <div className="cover-title">{coverShortTitle(title)}</div>
      {byline ? <div className="cover-by">{byline}</div> : null}
    </div>
  )
}
