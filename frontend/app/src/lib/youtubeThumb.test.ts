import { describe, expect, it } from 'vitest'
import { formatCount, mqThumb } from '@/lib/youtubeThumb'

describe('formatCount', () => {
  it('uses thousands separators', () => {
    expect(formatCount(58)).toBe('58')
    expect(formatCount(2700)).toBe('2,700')
    expect(formatCount(12345)).toBe('12,345')
  })
})

describe('mqThumb', () => {
  it('rewrites hqdefault to mqdefault', () => {
    expect(
      mqThumb('https://i.ytimg.com/vi/abc/hqdefault.jpg'),
    ).toBe('https://i.ytimg.com/vi/abc/mqdefault.jpg')
  })
})
