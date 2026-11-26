export function Progress({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div
      className="h-[3px] w-full bg-raised"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div className="h-full bg-accent" style={{ width: `${width}%` }} />
    </div>
  )
}
