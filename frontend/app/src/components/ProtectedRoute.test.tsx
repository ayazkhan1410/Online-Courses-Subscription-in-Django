import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/hooks/useAuth'
import { TOKEN_KEY, USER_KEY } from '@/lib/session'

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Login screen</p> },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/dashboard', element: <p>Dash</p> }],
      },
    ],
    { initialEntries: [path] },
  )
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends anonymous visitors to login', async () => {
    renderAt('/dashboard')
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })

  it('renders the page when a token is stored', async () => {
    localStorage.setItem(TOKEN_KEY, 'token')
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: 1,
        username: 'ada',
        email: 'ada@example.com',
        full_name: 'Ada',
        user_choices: 'expert',
        is_pro: false,
      }),
    )
    renderAt('/dashboard')
    expect(await screen.findByText('Dash')).toBeInTheDocument()
  })
})
