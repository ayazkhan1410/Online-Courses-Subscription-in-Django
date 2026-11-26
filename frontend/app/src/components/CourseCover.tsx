import { CategoryGlyph } from '@/components/CategoryGlyph'
import { cn } from '@/lib/cn'
import { stripEmoji } from '@/lib/text'

export function CourseCover({
  title,
  meta,
  categorySlug,
  categoryIcon,
  imageUrl,
  className,
}: {
  title: string
  meta: string
  categorySlug?: string | null
  categoryIcon?: string | null
  imageUrl?: string | null
  className?: string
}) {
  const label = stripEmoji(title)
  const thumb = (imageUrl || '').trim()
  if (thumb) {
    return (
      <div
        className={cn(
          'relative aspect-video overflow-hidden rounded-notebook bg-paper',
          className,
        )}
      >
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-4 text-paper">
          <p className="line-clamp-2 text-base font-medium leading-snug">{label}</p>
          <p className="mt-1 font-mono text-xs opacity-90">{meta}</p>
        </div>
      </div>
    )
  }
  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-notebook bg-paper text-notebook-ink',
        className,
      )}
    >
      <div className="absolute inset-y-0 left-8 w-px bg-notebook-line" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 pl-12" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="block h-px bg-notebook-line" />
        ))}
      </div>
      <div className="relative flex h-full flex-col justify-between p-4 pl-12">
        <CategoryGlyph icon={categoryIcon} slug={categorySlug} />
        <div>
          <p className="line-clamp-2 text-base font-medium leading-snug">{label}</p>
          <p className="mt-2 font-mono text-xs">{meta}</p>
        </div>
      </div>
    </div>
  )
}
