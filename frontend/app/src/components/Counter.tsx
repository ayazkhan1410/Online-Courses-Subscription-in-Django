import { padCounter } from '@/lib/lessonTitle'
import { cn } from '@/lib/cn'

export function Counter({
  done,
  total,
  className,
}: {
  done: number
  total: number
  className?: string
}) {
  const { current, rest } = padCounter(done, total)
  return (
    <span className={cn('counter', className)}>
      <b>{current}</b>
      <span>{rest}</span>
    </span>
  )
}

export function Ticks({
  done,
  total,
  className,
}: {
  done: number
  total: number
  className?: string
}) {
  const n = Math.max(0, total)
  const on = Math.max(0, Math.min(done, n))
  return (
    <div className={cn('ticks', className)} style={{ ['--n' as string]: n || 1 }}>
      {Array.from({ length: n || 1 }, (_, index) => {
        const cls = index < on ? 'on' : index === on && on < n ? 'now' : ''
        return <i key={index} className={cls || undefined} />
      })}
    </div>
  )
}
