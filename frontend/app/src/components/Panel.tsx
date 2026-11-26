import { cn } from '@/lib/cn'

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('panel', className)}>{children}</div>
}
