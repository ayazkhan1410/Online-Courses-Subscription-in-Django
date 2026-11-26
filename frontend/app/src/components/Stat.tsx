export function Stat({
  label,
  value,
  comparison,
}: {
  label: string
  value: string | number
  comparison?: string
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-2 font-mono text-[32px] leading-none tabular-nums">{value}</p>
      {comparison ? <p className="mt-3 text-sm text-ink-3">{comparison}</p> : null}
    </div>
  )
}
