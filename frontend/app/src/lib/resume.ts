/** Resume watch position: last 15s → 0, else rewind 3s. */
export function computeResumeSeconds(
  positionSeconds: number,
  durationSeconds?: number | null,
): number {
  const pos = Math.max(0, Math.floor(positionSeconds || 0))
  const dur = Math.max(0, Math.floor(durationSeconds || 0))
  if (dur > 0 && pos >= Math.max(0, dur - 15)) return 0
  if (pos <= 3) return 0
  return pos - 3
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
