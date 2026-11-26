import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Counter, Ticks } from '@/components/Counter'

describe('Counter', () => {
  it('shows a padded lesson counter', () => {
    render(<Counter done={7} total={50} />)
    expect(screen.getByText('07')).toBeInTheDocument()
    expect(screen.getByText('/ 50')).toBeInTheDocument()
  })
})

describe('Ticks', () => {
  it('marks completed and current ticks', () => {
    const { container } = render(<Ticks done={2} total={5} />)
    const ticks = container.querySelectorAll('.ticks i')
    expect(ticks).toHaveLength(5)
    expect(ticks[0]).toHaveClass('on')
    expect(ticks[1]).toHaveClass('on')
    expect(ticks[2]).toHaveClass('now')
  })
})
