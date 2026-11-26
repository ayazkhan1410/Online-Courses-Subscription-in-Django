import { cn } from '@/lib/cn'

export function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1">
      {tabs.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'h-9 rounded-control px-3 text-sm',
              selected ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-raised',
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
