import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { Field, controlClass } from '@/components/Input'
import { cn } from '@/lib/cn'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, id, className, children, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Field label={label} error={error} id={fieldId}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(controlClass, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
})
