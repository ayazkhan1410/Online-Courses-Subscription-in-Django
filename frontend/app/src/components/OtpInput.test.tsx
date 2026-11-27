import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OtpInput } from '@/components/OtpInput'

describe('OtpInput', () => {
  it('calls onChange as digits are entered', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OtpInput value="" onChange={onChange} />)
    const first = screen.getByLabelText('Digit 1')
    await user.type(first, '1')
    expect(onChange).toHaveBeenCalled()
  })

  it('pastes a full code', () => {
    const onChange = vi.fn()
    render(<OtpInput value="" onChange={onChange} />)
    const first = screen.getByLabelText('Digit 1')
    fireEvent.paste(first, {
      clipboardData: { getData: () => '123456' },
    })
    expect(onChange).toHaveBeenCalledWith('123456')
  })

  it('renders six digit fields', () => {
    render(<OtpInput value="12" onChange={() => undefined} />)
    expect(screen.getByLabelText('Digit 1')).toHaveValue('1')
    expect(screen.getByLabelText('Digit 2')).toHaveValue('2')
    expect(screen.getByLabelText('Digit 6')).toBeInTheDocument()
  })
})