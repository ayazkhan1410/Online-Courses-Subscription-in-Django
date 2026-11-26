import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/Button'

export function EmptyState({
  title,
  body,
  actionLabel,
  to,
}: {
  title: string
  body: string
  actionLabel: string
  to: string
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-10">
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-3 max-w-xl text-ink-2">{body}</p>
      <Link to={to} className={buttonClass('primary', 'md', 'mt-6')}>
        {actionLabel}
      </Link>
    </div>
  )
}
