import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('animated progress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rolls the counter when done increases', () => {
    const { rerender } = render(<Counter done={7} total={50} animate />)
    rerender(<Counter done={8} total={50} animate />)
    expect(screen.getByTestId('counter-roll')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByTestId('counter-roll')).not.toBeInTheDocument()
    expect(screen.getByText('08')).toBeInTheDocument()
  })

  it('animates tick fill when done increases', () => {
    const { container, rerender } = render(<Ticks done={2} total={5} animate />)
    rerender(<Ticks done={3} total={5} animate />)
    expect(
      container.querySelector('[data-tick-motion="tick-fill"]'),
    ).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(
      container.querySelector('[data-tick-motion="tick-fill"]'),
    ).toBeFalsy()
  })

  it('animates tick unfill when done decreases', () => {
    const { container, rerender } = render(<Ticks done={3} total={5} animate />)
    rerender(<Ticks done={2} total={5} animate />)
    expect(
      container.querySelector('[data-tick-motion="tick-unfill"]'),
    ).toBeTruthy()
  })
})
