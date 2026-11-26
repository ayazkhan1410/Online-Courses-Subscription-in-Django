import { cn } from '@/lib/cn'

export function Chip({
  pressed,
  onClick,
  children,
  meta,
  className,
}: {
  pressed?: boolean
  onClick?: () => void
  children: React.ReactNode
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn('chip', className)}
      aria-pressed={pressed ? 'true' : 'false'}
      onClick={onClick}
    >
      {children}
      {meta != null ? <span className="meta">{meta}</span> : null}
    </button>
  )
}
