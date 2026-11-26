import { Button } from '@/components/Button'

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-10" role="alert">
      <h2 className="text-2xl">Something went wrong</h2>
      <p className="mt-3 max-w-xl text-ink-2">{message}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
