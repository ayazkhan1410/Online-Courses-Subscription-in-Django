import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-on hover:bg-accent-hover border border-transparent',
  secondary: 'bg-surface text-ink border border-line hover:bg-raised hover:border-line-strong',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-raised',
}

const sizes: Record<Size, string> = {
  md: 'h-10 px-4 text-base',
  sm: 'h-8 px-3 text-sm',
}

export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium',
    'transition-transform duration-[120ms] ease-swa active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  )
}
