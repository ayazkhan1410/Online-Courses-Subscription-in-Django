import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface p-5 transition-colors duration-200 ease-swa hover:border-line-strong',
        className,
      )}
      {...props}
    />
  )
}
