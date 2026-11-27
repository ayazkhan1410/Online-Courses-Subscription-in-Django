import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Course, Module } from '@/api/types'
import { FeaturedPlayer } from '@/components/home/FeaturedPlayer'
import {
  demoFeaturedRows,
  liveFeaturedRows,
} from '@/components/home/featuredPlayerUtils'

function mod(id: number, name: string): Module {
  return {
    id,
    module_name: name,
    module_description: '',
    module_video: null,
    embed_url: null,
    youtube_video_id: null,
    thumbnail_url: null,
    sort_order: id,
    can_view: true,
    is_completed: false,
    is_locked: false,
    duration_seconds: 600,
  }
}

function course(modules: Module[]): Course {
  return {
    id: 1,
    courses_name: '50 Days of Python Programming challenge',
    courses_description: '',
    is_premium: false,
    course_image: null,
    thumbnail_url: 'https://i.ytimg.com/vi/x/hqdefault.jpg',
    playlist_url: '',
    youtube_playlist_id: 'p',
    slug: '50-days-of-python-programming-challenge',
    level: 'beginner',
    language: 'ur-hi',
    category: { name: 'Study with Ayaz', slug: 'study-with-ayaz', icon: '' },
    creator: {
      name: 'Ayaz',
      slug: 'ayaz',
      avatar_url: '',
      channel_url: '',
      is_owner: true,
    },
    attribution: '',
    module_count: modules.length,
    is_enrolled: false,
    is_wishlisted: false,
    progress_percent: 0,
    course_modules: modules,
  }
}

const modules = Array.from({ length: 12 }, (_, i) =>
  mod(
    i + 1,
    `Day ${String(i + 1).padStart(2, '0')}/50 - Topic ${i + 1} | Python`,
  ),
)

describe('featured player helpers', () => {
  it('builds logged-out demo rows for days 6–9 at 07/50', () => {
    const { done, rows } = demoFeaturedRows(modules)
    expect(done).toBe(7)
    expect(rows).toHaveLength(4)
    expect(rows[0].state).toBe('done')
    expect(rows[2].state).toBe('now')
    expect(rows[3].state).toBe('todo')
  })

  it('builds logged-in rows around the next lesson', () => {
    const { nextIndex, rows } = liveFeaturedRows(modules, 4)
    expect(nextIndex).toBe(4)
    expect(rows.some((r) => r.state === 'now')).toBe(true)
    expect(rows[0].module.id).toBe(3)
  })
})

describe('FeaturedPlayer', () => {
  it('renders start day 1 for demo state', () => {
    const { done, rows } = demoFeaturedRows(modules)
    render(
      <MemoryRouter>
        <FeaturedPlayer
          course={course(modules)}
          done={done}
          total={50}
          rows={rows}
          playHref="/learn/50-days/1"
          ctaHref="/learn/50-days/1"
          ctaLabel="Start day 1"
          eyebrow="Most people start here"
          headline="50 Days of Python. One lesson a day."
          body="Ten minutes a day."
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Start day 1' })).toBeInTheDocument()
    expect(screen.getByText('Most people start here')).toBeInTheDocument()
  })

  it('renders continue day N for live state', () => {
    const { rows } = liveFeaturedRows(modules, 4)
    render(
      <MemoryRouter>
        <FeaturedPlayer
          course={course(modules)}
          done={4}
          total={12}
          rows={rows}
          playHref="/learn/50-days/5"
          ctaHref="/learn/50-days/5"
          ctaLabel="Continue day 5"
          eyebrow="Pick up where you left off"
          headline="50 Days of Python Programming challenge"
          body="Resume."
        />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('link', { name: 'Continue day 5' }),
    ).toBeInTheDocument()
  })
})
