import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Module } from '@/api/types'
import { cleanLessonTitle } from '@/lib/lessonTitle'

export function LessonList({
  slug,
  modules,
  currentId,
}: {
  slug: string
  modules: Module[]
  currentId?: number
}) {
  const done = modules.filter((mod) => mod.is_completed).length

  return (
    <aside className="list" aria-label="Lessons">
      <div className="list-head">
        <h2 className="h3">Lessons</h2>
        <span className="meta">{done} done</span>
      </div>
      <ol>
        {modules.map((mod) => {
          const { counter, title } = cleanLessonTitle(mod.module_name)
          const isNow = mod.id === currentId
          const state = isNow ? 'now' : mod.is_completed ? 'done' : ''
          const label = counter ? counter.replace(/^day\s+/i, 'Day ') : null

          return (
            <li key={mod.id} className={state}>
              <Link
                to={mod.is_locked ? `#` : `/learn/${slug}/${mod.id}`}
                aria-current={isNow ? 'step' : undefined}
                onClick={mod.is_locked ? (event) => event.preventDefault() : undefined}
              >
                <span className="mark">
                  {mod.is_completed ? <Check className="i" size={10} strokeWidth={2.5} /> : null}
                </span>
                <span>
                  {label ? <span className="n">{label}</span> : null}
                  {title}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}