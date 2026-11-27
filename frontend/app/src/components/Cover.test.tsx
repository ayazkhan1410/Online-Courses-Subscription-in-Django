import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Cover } from '@/components/Cover'

describe('Cover', () => {
  it('renders generated cover copy without an image', () => {
    const { container } = render(
      <Cover
        title="Python in 50 days"
        categoryLabel="Python"
        lessons={50}
        categorySlug="study-with-ayaz"
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.cover.ink-ayaz')).not.toBeNull()
    expect(screen.getByText('Python in 50 days')).toBeInTheDocument()
    expect(screen.getByText('50 lessons')).toBeInTheDocument()
  })

  it('shows a playlist thumbnail when provided', () => {
    const { container } = render(
      <Cover
        title="Django Tutorials"
        categoryLabel="Backend"
        lessons={17}
        categorySlug="backend-engineering"
        imageUrl="https://i.ytimg.com/vi/abc/hqdefault.jpg"
      />,
    )
    const img = container.querySelector('img.cover-thumb')
    expect(img).toHaveAttribute('src', 'https://i.ytimg.com/vi/abc/hqdefault.jpg')
  })
})
