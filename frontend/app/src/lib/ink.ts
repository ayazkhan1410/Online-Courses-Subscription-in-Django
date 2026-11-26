/** Category ink class for covers / category dots. */

const BY_SLUG: Record<string, string> = {
  'study-with-ayaz': 'ayaz',
  python: 'python',
  'backend-engineering': 'backend',
  'frontend-engineering': 'frontend',
  'ai-and-machine-learning': 'ai',
  'devops-and-cloud': 'devops',
  'data-structures-and-interviews': 'dsa',
  'freelancing-and-career': 'career',
}

export function inkClass(slug?: string | null): string {
  const key = BY_SLUG[(slug ?? '').trim()] ?? 'ayaz'
  return `ink-${key}`
}

export function coverShortTitle(title: string): string {
  const cleaned = title.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= 42) return cleaned
  return `${cleaned.slice(0, 39).trim()}…`
}
