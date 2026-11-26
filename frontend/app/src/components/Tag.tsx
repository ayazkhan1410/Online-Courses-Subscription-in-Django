import type { ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-line px-2 text-xs text-ink-2">
      {children}
    </span>
  )
}
