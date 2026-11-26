import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { forgetPassword } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AuthSplit } from '@/components/PageHeader'
import { useToast } from '@/components/Toast'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { usePageTitle } from '@/hooks/usePageTitle'
import { forgotSchema, type ForgotValues } from '@/lib/schemas'

export default function ForgotPasswordPage() {
  usePageTitle('Forgot password')
  const toast = useToast()
  const turnstile = useRef<TurnstileHandle>(null)
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotValues, token: string) {
    try {
      const data = await forgetPassword({
        email: values.email,
        turnstile_token: token,
      })
      toast.push(data.message)
      form.reset()
    } catch (error) {
      turnstile.current?.reset()
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <AuthSplit title="Forgot password" lead="We email a reset link when the address is registered.">
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
        <TurnstileWidget ref={turnstile} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Send link
        </Button>
        <p className="text-sm">
          <Link to="/login">Back to log in</Link>
        </p>
      </form>
    </AuthSplit>
  )
}
