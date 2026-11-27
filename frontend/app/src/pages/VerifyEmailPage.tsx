import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { resendVerifyEmail, verifyEmail } from '@/api/verifyEmail'
import { Logo } from '@/components/Logo'
import { OtpInput } from '@/components/OtpInput'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { accessFromAuth } from '@/lib/session'

const RESEND_SECONDS = 60

export default function VerifyEmailPage() {
  usePageTitle('Verify email')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const toast = useToast()
  const email = params.get('email') ?? ''
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function submit(nextCode: string) {
    if (!email || nextCode.length !== 6) return
    setBusy(true)
    try {
      const data = await verifyEmail({ email, code: nextCode })
      setSession(accessFromAuth(data), data.user, data.refresh)
      navigate('/dashboard')
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    } finally {
      setBusy(false)
    }
  }

  async function onResend() {
    if (!email || cooldown > 0) return
    try {
      const data = await resendVerifyEmail(email)
      toast.push(data.message)
      setCooldown(RESEND_SECONDS)
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  if (!email) {
    return (
      <AuthShell>
        <div className="panel box">
          <h1 className="h2">Verify email</h1>
          <p className="dim small" style={{ marginTop: 6 }}>
            No email address to verify. Start from the sign-up form.
          </p>
          <Link className="btn btn-primary btn-lg" to="/register">
            Create account
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form
        className="panel box"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(code)
        }}
      >
        <div>
          <h1 className="h2">Check your email</h1>
          <p className="dim small" style={{ marginTop: 6 }}>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>
        </div>
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next)
            if (next.length === 6) void submit(next)
          }}
        />
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy || code.length !== 6}>
          Verify
        </button>
        <p className="foot">
          {cooldown > 0 ? (
            <span className="dim">Resend code in {cooldown}s</span>
          ) : (
            <button type="button" className="link" onClick={() => void onResend()}>
              Resend code
            </button>
          )}
          <span aria-hidden> · </span>
          <Link className="link dim" to="/register">
            Use a different email
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <header className="wrap top">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="center">{children}</main>
    </div>
  )
}