/** Prefer lightweight YouTube thumbs for decorative walls and stacks. */
export function mqThumb(url: string | null | undefined): string {
  const raw = (url || '').trim()
  if (!raw) return ''
  return raw
    .replace(/\/hqdefault\./, '/mqdefault.')
    .replace(/\/maxresdefault\./, '/mqdefault.')
    .replace(/\/sddefault\./, '/mqdefault.')
}

export function mqThumbFromVideoId(videoId: string | null | undefined): string {
  const id = (videoId || '').trim()
  if (!id) return ''
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
