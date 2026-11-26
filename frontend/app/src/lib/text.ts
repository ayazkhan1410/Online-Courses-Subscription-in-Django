const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu

export function stripEmoji(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\u{FE0F}/gu, '')
    .replace(/\u{200D}/gu, '')
    .replace(EMOJI_RE, '')
    .replace(/!+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function stripHtml(html: string | null | undefined): string {
  const raw = String(html ?? '')
  if (typeof document !== 'undefined') {
    const template = document.createElement('template')
    template.innerHTML = raw
    template.content.querySelectorAll('script, style').forEach((node) => {
      node.remove()
    })
    return stripEmoji(template.content.textContent ?? '')
  }
  return stripEmoji(raw.replace(/<[^>]+>/g, ' '))
}

export function lessonLabel(index: number, total: number): string {
  const position = Math.max(1, index + 1)
  const count = Math.max(position, total || 0)
  return `Lesson ${String(position).padStart(2, '0')} / ${String(count).padStart(2, '0')}`
}

export function lessonIndex(progressPercent: number, total: number): number {
  if (total <= 0) return 0
  const completed = Math.round((progressPercent / 100) * total)
  return Math.min(total - 1, Math.max(0, completed === 0 ? 0 : completed - 1))
}
