import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/Toast'

const verifyEmail = vi.fn()
const resendVerifyEmail = vi.fn()

vi.mock('@/api/verifyEmail', () => ({
  verifyEmail: (...args: unknown[]) => verifyEmail(...args),
  resendVerifyEmail: (...args: unknown[]) => resendVerifyEmail(...args),
}))

function renderPage(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    verifyEmail.mockReset()
    resendVerifyEmail.mockReset()
  })

  it('prompts for sign-up when email is missing', () => {
    renderPage('')
    expect(screen.getByText(/no email address/i)).toBeInTheDocument()
  })

  it('verifies a code and navigates to dashboard', async () => {
    const user = userEvent.setup()
    verifyEmail.mockResolvedValue({
      token: 'tok',
      user: { id: 1, username: 'u', email: 'a@b.com', full_name: '', user_choices: '', is_pro: false },
    })
    renderPage('?email=test%40example.com')
    const digits = Array.from({ length: 6 }, (_, i) => screen.getByLabelText(`Digit ${i + 1}`))
    for (let i = 0; i < 6; i += 1) {
      await user.type(digits[i], String(i + 1))
    }
    await waitFor(() => expect(verifyEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      code: '123456',
    }))
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })
})