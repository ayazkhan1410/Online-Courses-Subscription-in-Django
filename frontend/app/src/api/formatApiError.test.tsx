import { describe, expect, it } from 'vitest'
import { ApiError, formatApiError } from '@/api/client'

describe('formatApiError', () => {
  it('joins field errors and non_field_errors', () => {
    const error = new ApiError('Request failed', 400, {
      email: ['Email already exists'],
      non_field_errors: ['Invalid'],
    })
    expect(formatApiError(error)).toBe('Email already exists Invalid')
  })

  it('prefers detail when there are no field errors', () => {
    const error = new ApiError('Request failed', 400, {
      detail: 'Invalid email or password',
    })
    expect(formatApiError(error)).toBe('Invalid email or password')
  })

  it('falls back to the error message', () => {
    expect(formatApiError(new Error('Network down'))).toBe('Network down')
  })
})
