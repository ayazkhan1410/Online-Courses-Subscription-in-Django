import type { StreakWeekDay } from '@/api/types'
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

export function WeekGoalTicks({
  days,
  className,
}: {
  days: StreakWeekDay[]
  className?: string
}) {
  return (
    <div className={cn('week-ticks', className)}>
      {days.map((day) => (
        <div key={day.date} className="week-tick">
          <i
            className={cn(
              day.goal_met && 'on',
              day.is_today && 'today',
            )}
            title={`${day.weekday}: ${day.lesson_count} lesson${
              day.lesson_count === 1 ? '' : 's'
            }`}
          />
          <span className="week-tick-label meta">{day.weekday}</span>
        </div>
      ))}
    </div>
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
