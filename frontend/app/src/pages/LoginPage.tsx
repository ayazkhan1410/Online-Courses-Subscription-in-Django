import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { googleLogin, isMfaChallenge, login } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { mfaResend, mfaVerify } from '@/api/mfa'
import type { MfaChallenge, User } from '@/api/types'
import { Button } from '@/components/Button'
import { GoogleButton } from '@/components/GoogleButton'
import { Input } from '@/components/Input'
import { AuthSplit } from '@/components/PageHeader'
import { useToast } from '@/components/Toast'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { safeNext } from '@/lib/session'

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

  function finish(token: string, user: User) {
    setSession(token, user)
    navigate(safeNext(params.get('next')))
  }

  async function onSubmit(values: LoginValues, token: string) {
    try {
      const data = await login({
        ...values,
        turnstile_token: token,
      })
      if (isMfaChallenge(data)) {
        const initial = data.methods.includes('totp') ? 'totp' : (data.methods[0] ?? 'email')
        setMethod(initial)
        setChallenge(data)
        return
      }
      finish(data.token, data.user)
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
      finish(data.token, data.user)
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
      finish(data.token, data.user)
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <AuthSplit title="Log in" lead="Use the email on your account.">
      {challenge ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submitCode(code)
          }}
        >
          <p className="text-sm text-ink-2">
            {method === 'email'
              ? 'Enter the 6-digit code from email.'
              : method === 'recovery'
                ? 'Enter one unused recovery code.'
                : 'Enter the 6-digit code from your authenticator.'}
          </p>
          <Input
            label={method === 'recovery' ? 'Recovery code' : '6-digit code'}
            value={code}
            inputMode={method === 'recovery' ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            maxLength={method === 'recovery' ? 32 : 6}
            onChange={(event) => {
              const next = method === 'recovery'
                ? event.target.value
                : event.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(next)
              if (method !== 'recovery' && next.length === 6) void submitCode(next)
            }}
          />
          <Button type="submit">Verify</Button>
          <div className="flex gap-4 text-sm">
            {challenge.methods.includes('email') ? (
              <button
                type="button"
                className="text-ink-2"
                onClick={() => {
                  setMethod('email')
                  void mfaResend(challenge.challenge_token)
                    .then((data) => toast.push(data.message))
                    .catch((error: unknown) => toast.push(formatApiError(error), 'err'))
                }}
              >
                Email a code
              </button>
            ) : null}
            <button type="button" className="text-ink-2" onClick={() => setMethod('recovery')}>
              Use a recovery code
            </button>
          </div>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            const token = turnstile.current?.getToken() ?? ''
            void form.handleSubmit((values) => onSubmit(values, token))(event)
          }}
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <TurnstileWidget ref={turnstile} />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Log in
          </Button>
          <GoogleButton onCredential={(credential) => void onGoogle(credential)} />
          <p className="text-sm text-ink-2">
            <Link to="/forgot-password">Forgot password</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/register">Create account</Link>
          </p>
        </form>
      )}
    </AuthSplit>
  )
}
