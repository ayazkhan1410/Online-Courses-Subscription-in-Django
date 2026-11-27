import { useEffect, useRef, useState } from 'react'
import type { StreakWeekDay } from '@/api/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { padCounter } from '@/lib/lessonTitle'
import { cn } from '@/lib/cn'

export function Counter({
  done,
  total,
  className,
  animate = false,
}: {
  done: number
  total: number
  className?: string
  animate?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const prevDone = useRef(done)
  const [roll, setRoll] = useState<{
    from: string
    to: string
    direction: 'up' | 'down'
  } | null>(null)
  const { current, rest } = padCounter(done, total)
  const shouldAnimate = animate && !reducedMotion

  useEffect(() => {
    if (!shouldAnimate) {
      prevDone.current = done
      return
    }
    if (prevDone.current === done) return
    const from = padCounter(prevDone.current, total).current
    const to = padCounter(done, total).current
    const direction = done > prevDone.current ? 'up' : 'down'
    prevDone.current = done
    setRoll({ from, to, direction })
    const timer = window.setTimeout(() => setRoll(null), 200)
    return () => window.clearTimeout(timer)
  }, [done, total, shouldAnimate])

  const digit = roll ? (
    <span
      className="counter-digit-slot"
      data-rolling={roll.direction}
      data-testid="counter-roll"
    >
      <span
        className={cn(
          'counter-digit-track',
          'counter-digit-track-roll',
        )}
        data-direction={roll.direction}
      >
        <b>{roll.from}</b>
        <b>{roll.to}</b>
      </span>
    </span>
  ) : (
    <b>{current}</b>
  )

  return (
    <span className={cn('counter', className)} data-done={done}>
      {digit}
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
  animate = false,
}: {
  done: number
  total: number
  className?: string
  animate?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const prevDone = useRef(done)
  const [tickMotion, setTickMotion] = useState<{
    index: number
    direction: 'fill' | 'unfill'
  } | null>(null)
  const n = Math.max(0, total)
  const on = Math.max(0, Math.min(done, n))
  const shouldAnimate = animate && !reducedMotion

  useEffect(() => {
    if (!shouldAnimate) {
      prevDone.current = done
      return
    }
    if (prevDone.current === done) return
    const direction = done > prevDone.current ? 'fill' : 'unfill'
    const index = direction === 'fill' ? done - 1 : prevDone.current - 1
    prevDone.current = done
    if (index >= 0 && index < n) {
      setTickMotion({ index, direction })
      const timer = window.setTimeout(() => setTickMotion(null), 200)
      return () => window.clearTimeout(timer)
    }
    prevDone.current = done
  }, [done, n, shouldAnimate])

  return (
    <div className={cn('ticks', className)} style={{ ['--n' as string]: n || 1 }}>
      {Array.from({ length: n || 1 }, (_, index) => {
        const cls = index < on ? 'on' : index === on && on < n ? 'now' : ''
        const motion =
          tickMotion?.index === index
            ? tickMotion.direction === 'fill'
              ? 'tick-fill'
              : 'tick-unfill'
            : ''
        return (
          <i
            key={index}
            className={cn(cls, motion) || undefined}
            data-tick-motion={motion || undefined}
          />
        )
      })}
    </div>
  )
}