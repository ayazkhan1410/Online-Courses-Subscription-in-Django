import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-control bg-raised', className)} aria-hidden="true" />
}
