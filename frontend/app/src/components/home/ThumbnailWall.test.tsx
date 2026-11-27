import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThumbnailWall } from '@/components/home/ThumbnailWall'

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

describe('ThumbnailWall', () => {
  it('pauses drift rows under reduced motion', () => {
    const { container } = render(
      <div className="home-hero">
        <ThumbnailWall
          urls={[
            'https://i.ytimg.com/vi/a/hqdefault.jpg',
            'https://i.ytimg.com/vi/b/hqdefault.jpg',
            'https://i.ytimg.com/vi/c/hqdefault.jpg',
          ]}
        />
      </div>,
    )
    const rows = container.querySelectorAll('.home-wall .row')
    expect(rows.length).toBe(3)
    rows.forEach((row) => {
      expect(row.classList.contains('is-paused')).toBe(true)
    })
  })
})
