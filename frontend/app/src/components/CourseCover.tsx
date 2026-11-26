import { BookOpen, Code2, Terminal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { stripEmoji } from '@/lib/text'

function CoverGlyph({ title }: { title: string }) {
  const value = title.toLowerCase()
  const icon =
    value.includes('python') || value.includes('django') || value.includes('code')
      ? 'code'
      : value.includes('linux') || value.includes('terminal') || value.includes('bash')
        ? 'terminal'
        : 'book'
  if (icon === 'code') return <Code2 size={18} strokeWidth={1.5} aria-hidden="true" />
  if (icon === 'terminal') return <Terminal size={18} strokeWidth={1.5} aria-hidden="true" />
  return <BookOpen size={18} strokeWidth={1.5} aria-hidden="true" />
}

export function CourseCover({
  title,
  meta,
  className,
}: {
  title: string
  meta: string
  className?: string
}) {
  const label = stripEmoji(title)
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
        <CoverGlyph title={label} />
        <div>
          <p className="line-clamp-2 text-base font-medium leading-snug">{label}</p>
          <p className="mt-2 font-mono text-xs">{meta}</p>
        </div>
      </div>
    </div>
  )
}
