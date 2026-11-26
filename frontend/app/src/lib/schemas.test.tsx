import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/schemas'

describe('auth schemas', () => {
  it('rejects a login without a valid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'secret' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'ada@example.com', password: 'secret' }).success).toBe(
      true,
    )
  })

  it('requires a username and an 8 character password to register', () => {
    expect(
      registerSchema.safeParse({
        username: '',
        email: 'ada@example.com',
        password: 'longenough',
      }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({
        username: 'ada',
        email: 'ada@example.com',
        password: 'short',
      }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({
        username: 'ada',
        email: 'not-an-email',
        password: 'longenough',
      }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({
        username: 'ada',
        email: 'ada@example.com',
        password: 'longenough',
      }).success,
    ).toBe(true)
  })
})
