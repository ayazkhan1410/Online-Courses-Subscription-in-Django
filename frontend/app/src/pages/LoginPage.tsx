import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { googleLogin, isMfaChallenge, isVerificationRequired, login } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { mfaResend, mfaVerify } from '@/api/mfa'
import type { MfaChallenge, User } from '@/api/types'
import { GoogleButton } from '@/components/GoogleButton'
import { Logo } from '@/components/Logo'
import { OtpInput } from '@/components/OtpInput'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { accessFromAuth, safeNext } from '@/lib/session'

export default function LoginPage() {
  usePageTitle('Log in')
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const turnstile = useRef<TurnstileHandle>(null)
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null)
  const [method, setMethod] = useState('totp')
  const [code, setCode] = useState('')
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function finish(data: { token: string; access?: string; refresh?: string; user: User }) {
    setSession(accessFromAuth(data), data.user, data.refresh)
    navigate(safeNext(params.get('next')))
  }

  async function onSubmit(values: LoginValues, token: string) {
    try {
      const data = await login({
        ...values,
        turnstile_token: token,
      })
      if (isVerificationRequired(data)) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      if (isMfaChallenge(data)) {
        const initial = data.methods.includes('totp')
          ? 'totp'
          : (data.methods.includes('email') ? 'email' : (data.methods[0] ?? 'totp'))
        setMethod(initial)
        setChallenge(data)
        return
      }
      finish(data)
    } catch (error) {
      turnstile.current?.reset()
      toast.push(formatApiError(error), 'err')
    }
  }

  async function submitCode(nextCode: string) {
    if (!challenge) return
    try {
      const data = await mfaVerify({
        challenge_token: challenge.challenge_token,
        code: nextCode.trim(),
        method,
      })
      finish(data)
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  async function onGoogle(credential: string) {
    try {
      const data = await googleLogin(credential)
      if (isMfaChallenge(data)) {
        const initial = data.methods.includes('totp') ? 'totp' : (data.methods[0] ?? 'email')
        setMethod(initial)
        setChallenge(data)
        return
      }
      finish(data)
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <div className="auth-page">
      <header className="wrap top">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="center">
        {challenge ? (
          <form
            className="panel box"
            onSubmit={(event) => {
              event.preventDefault()
              void submitCode(code)
            }}
          >
            <div>
              <h1 className="h2">Enter your code</h1>
              <p className="dim small" style={{ marginTop: 6 }}>
                {method === 'email'
                  ? 'Type the 6-digit code we emailed you.'
                  : method === 'recovery'
                    ? 'Enter one unused recovery code.'
                    : 'Open your authenticator app and type the 6-digit code for Study with Ayaz.'}
              </p>
            </div>
            {method === 'recovery' ? (
              <label className="field">
                <span className="label">Recovery code</span>
                <input
                  className="input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="one-time-code"
                />
              </label>
            ) : (
              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next)
                  if (next.length === 6) void submitCode(next)
                }}
              />
            )}
            <button className="btn btn-primary btn-lg" type="submit">
              Verify
            </button>
            {challenge.methods.includes('email') && method !== 'email' ? (
              <EmailMfaOption
                onEmail={() => {
                  setMethod('email')
                  void mfaResend(challenge.challenge_token)
                    .then((data) => toast.push(data.message))
                    .catch((error: unknown) => toast.push(formatApiError(error), 'err'))
                }}
              />
            ) : null}
            <p className="foot">
              {challenge.methods.includes('totp') ? (
                <>
                  <button type="button" className="link" onClick={() => setMethod('recovery')}>
                    Use a recovery code
                  </button>
                  <span aria-hidden> · </span>
                </>
              ) : null}
              <button
                type="button"
                className="dim link"
                onClick={() => {
                  setChallenge(null)
                  setCode('')
                }}
              >
                Back to log in
              </button>
            </p>
          </form>
        ) : (
          <form
            className="panel box"
            onSubmit={(event) => {
              const token = turnstile.current?.getToken() ?? ''
              void form.handleSubmit((values) => onSubmit(values, token))(event)
            }}
          >
            <div>
              <h1 className="h2">Log in</h1>
              <p className="dim small" style={{ marginTop: 6 }}>
                Pick up the lesson where you stopped.
              </p>
            </div>
            <GoogleButton onCredential={(credential) => void onGoogle(credential)} />
            <div className="or">or</div>
            <label className="field">
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
            </label>
            <label className="field">
              <span className="row">
                <span className="label">Password</span>
                <Link className="link small" to="/forgot-password">
                  Forgot password
                </Link>
              </span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
            </label>
            <TurnstileWidget ref={turnstile} />
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              Log in
            </button>
            <p className="foot">
              New here?{' '}
              <Link className="link" to="/register">
                Create a free account
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}

function EmailMfaOption({ onEmail }: { onEmail: () => void }) {
  return (
    <div className="method">
      <Mail size={18} strokeWidth={1.5} aria-hidden />
      <span>
        No phone nearby?{' '}
        <button type="button" className="link" onClick={onEmail}>
          Email me a code
        </button>
      </span>
    </div>
  )
}