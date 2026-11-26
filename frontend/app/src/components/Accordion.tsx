import { useId, useState } from 'react'
import { cn } from '@/lib/cn'

export function Accordion({
  items,
}: {
  items: { id: string; title: string; body: string }[]
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  const baseId = useId()
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item) => {
        const expanded = open === item.id
        const panelId = `${baseId}-${item.id}`
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between px-5 text-left text-base"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : item.id)}
              >
                {item.title}
                <span className="font-mono text-sm text-ink-3" aria-hidden="true">
                  {expanded ? '–' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              hidden={!expanded}
              className={cn('px-5 pb-5 text-sm text-ink-2', !expanded && 'hidden')}
            >
              {item.body}
            </div>
          </div>
        )
      })}
    </div>
  )
}
