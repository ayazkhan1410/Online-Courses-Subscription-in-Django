import type { Module } from '@/api/types'
import { cleanLessonTitle } from '@/lib/lessonTitle'

export type FeaturedRow = {
  module: Module
  state: 'done' | 'now' | 'todo'
}

/** Demo window for logged-out 50 Days preview (days 6–9, counter at 07/50). */
export function demoFeaturedRows(modules: Module[]): {
  done: number
  rows: FeaturedRow[]
} {
  const slice = modules.slice(5, 9)
  const rows: FeaturedRow[] = slice.map((module, index) => ({
    module,
    state: index < 2 ? 'done' : index === 2 ? 'now' : 'todo',
  }))
  return { done: 7, rows }
}

export function liveFeaturedRows(
  modules: Module[],
  done: number,
): { nextIndex: number; rows: FeaturedRow[] } {
  const nextIndex = Math.min(modules.length - 1, Math.max(0, done))
  const start = Math.max(0, nextIndex - 2)
  const end = Math.min(modules.length, nextIndex + 3)
  const rows: FeaturedRow[] = modules.slice(start, end).map((module, i) => {
    const absolute = start + i
    if (absolute < nextIndex) return { module, state: 'done' as const }
    if (absolute === nextIndex) return { module, state: 'now' as const }
    return { module, state: 'todo' as const }
  })
  return { nextIndex, rows }
}

export function dayNumberLabel(
  module: Module | undefined,
  fallback: number,
): number {
  if (!module) return fallback
  const cleaned = cleanLessonTitle(module.module_name)
  const match = cleaned.counter?.match(/(\d+)/)
  if (match) return Number(match[1])
  return fallback
}
