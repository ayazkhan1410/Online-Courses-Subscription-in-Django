import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/Input'

describe('Input', () => {
  it('connects the label and shows an error', async () => {
    const user = userEvent.setup()
    render(<Input label="Email" error="Enter a valid email" />)
    const field = screen.getByLabelText('Email')
    await user.type(field, 'ada')
    expect(field).toHaveValue('ada')
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(field).toHaveAttribute('aria-invalid', 'true')
  })
})
