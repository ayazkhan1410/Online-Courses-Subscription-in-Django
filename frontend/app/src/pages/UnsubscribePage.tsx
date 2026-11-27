import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api, formatApiError } from '@/api/client'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { usePageTitle } from '@/hooks/usePageTitle'

type UnsubscribeResponse = { message: string }

export default function UnsubscribePage() {
  usePageTitle('Unsubscribe')
  const { token = '' } = useParams()
  const query = useQuery({
    queryKey: ['unsubscribe', token],
    queryFn: () =>
      api<UnsubscribeResponse>(
        `/email/unsubscribe/${encodeURIComponent(token)}/`,
        { method: 'POST', auth: false, body: {} },
      ),
    enabled: Boolean(token),
    retry: false,
  })

  return (
    <>
      <header className="top">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="center">
        <div className="panel box">
          <div>
            <h1 className="h2">Weekly reminders</h1>
            {query.isLoading ? (
              <p className="dim small" style={{ marginTop: 6 }}>
                Turning off weekly reminder emails…
              </p>
            ) : null}
            {query.isSuccess ? (
              <p className="dim small" style={{ marginTop: 6 }}>
                Weekly reminder emails are turned off.
              </p>
            ) : null}
            {query.isError ? (
              <p className="dim small" style={{ marginTop: 6 }}>
                {formatApiError(query.error)}
              </p>
            ) : null}
          </div>
          <p className="foot">
            <Link className="link" to="/login">
              Back to log in
            </Link>
            <span aria-hidden> · </span>
            <Link className="link" to="/dashboard/settings">
              Settings
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
