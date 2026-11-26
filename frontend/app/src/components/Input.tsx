import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

export const controlClass =
  'h-10 w-full rounded-control border border-line bg-surface px-3 text-base text-ink outline-none'

type FieldProps = {
  label: string
  error?: string
  id: string
  children: ReactNode
}

export function Field({ label, error, id, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-err">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Field label={label} error={error} id={fieldId}>
      <input
        ref={ref}
        id={fieldId}
        className={cn(controlClass, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
    </Field>
  )
})
