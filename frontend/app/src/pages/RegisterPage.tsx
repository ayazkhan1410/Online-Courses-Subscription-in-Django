import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogin, isMfaChallenge, register } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { GoogleButton } from '@/components/GoogleButton'
import { Input } from '@/components/Input'
import { AuthSplit } from '@/components/PageHeader'
import { useToast } from '@/components/Toast'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { registerSchema, type RegisterValues } from '@/lib/schemas'

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
      setSession(data.token, data.user)
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
      setSession(data.token, data.user)
      navigate('/dashboard')
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <AuthSplit title="Create account" lead="A username, email, and password.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          const token = turnstile.current?.getToken() ?? ''
          void form.handleSubmit((values) => onSubmit(values, token))(event)
        }}
      >
        <Input
          label="Username"
          autoComplete="username"
          error={form.formState.errors.username?.message}
          {...form.register('username')}
        />
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
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <TurnstileWidget ref={turnstile} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Create account
        </Button>
        <GoogleButton onCredential={(credential) => void onGoogle(credential)} />
        <p className="text-sm text-ink-2">
          <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthSplit>
  )
}
