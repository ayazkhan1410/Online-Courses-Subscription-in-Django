import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[]
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-2">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.to ? (
              <Link to={item.to} className="hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={cn(index === items.length - 1 && 'text-ink')}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
