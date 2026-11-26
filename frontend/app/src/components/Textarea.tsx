import { useId, type TextareaHTMLAttributes } from 'react'
import { Field } from '@/components/Input'
import { cn } from '@/lib/cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export function Textarea({ label, error, id, className, ...props }: Props) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Field label={label} error={error} id={fieldId}>
      <textarea
        id={fieldId}
        className={cn(
          'min-h-32 w-full rounded-control border border-line bg-surface px-3 py-2 text-base text-ink',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
    </Field>
  )
}
