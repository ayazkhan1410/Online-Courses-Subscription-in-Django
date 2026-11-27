import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogin, isMfaChallenge, isVerificationRequired, register } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { GoogleButton } from '@/components/GoogleButton'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { registerSchema, type RegisterValues } from '@/lib/schemas'
import { accessFromAuth } from '@/lib/session'

export default function RegisterPage() {
  usePageTitle('Register')
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const turnstile = useRef<TurnstileHandle>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterValues, token: string) {
    try {
      const data = await register({
        ...values,
        turnstile_token: token,
      })
      if (isVerificationRequired(data)) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      setSession(accessFromAuth(data), data.user, data.refresh)
      navigate('/dashboard')
    } catch (error) {
      turnstile.current?.reset()
      toast.push(formatApiError(error), 'err')
    }
  }

  async function onGoogle(credential: string) {
    try {
      const data = await googleLogin(credential)
      if (isMfaChallenge(data)) {
        navigate('/login')
        toast.push('Finish the sign-in code on the log in page')
        return
      }
      setSession(accessFromAuth(data), data.user, data.refresh)
      navigate('/dashboard')
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
        <form
          className="panel box"
          onSubmit={(event) => {
            const token = turnstile.current?.getToken() ?? ''
            void form.handleSubmit((values) => onSubmit(values, token))(event)
          }}
        >
          <div>
            <h1 className="h2">Create account</h1>
            <p className="dim small" style={{ marginTop: 6 }}>
              A username, email, and password.
            </p>
          </div>
          <GoogleButton onCredential={(credential) => void onGoogle(credential)} />
          <div className="or">or</div>
          <label className="field">
            <span className="label">Username</span>
            <input
              className="input"
              autoComplete="username"
              {...form.register('username')}
            />
          </label>
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
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
          </label>
          <TurnstileWidget ref={turnstile} />
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            Create account
          </button>
          <p className="foot">
            Already learning?{' '}
            <Link className="link" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
