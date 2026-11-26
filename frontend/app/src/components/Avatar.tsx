export function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = (parts.length > 1
    ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
    : (parts[0] ?? '?').slice(0, 2)
  ).toUpperCase()
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-raised font-mono text-sm text-ink"
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  )
}
