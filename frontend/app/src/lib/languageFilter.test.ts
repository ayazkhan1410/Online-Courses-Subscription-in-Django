import { describe, expect, it } from 'vitest'
import { catalogSearchParams } from '@/lib/languageFilter'

describe('language chips in the URL', () => {
  it('keeps language in the query string', () => {
    const params = catalogSearchParams({ language: 'ur-hi', page: 1 })
    expect(params.get('language')).toBe('ur-hi')
    expect(params.has('page')).toBe(false)
  })

  it('combines with category and level', () => {
    const params = catalogSearchParams({
      language: 'en',
      category: 'python',
      level: 'beginner',
      page: 2,
    })
    expect(params.toString()).toBe(
      'category=python&level=beginner&language=en&page=2',
    )
  })
})
