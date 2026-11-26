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
})
