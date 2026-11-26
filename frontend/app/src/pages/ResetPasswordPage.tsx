import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { changePassword } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AuthSplit } from '@/components/PageHeader'
import { useToast } from '@/components/Toast'
import { usePageTitle } from '@/hooks/usePageTitle'
import { resetSchema, type ResetValues } from '@/lib/schemas'

export default function ResetPasswordPage() {
  usePageTitle('Reset password')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const toast = useToast()
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm_password: '' },
  })

  async function onSubmit(values: ResetValues) {
    try {
      const data = await changePassword({ token, ...values })
      toast.push(data.message)
      form.reset()
    } catch (error) {
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <AuthSplit title="Reset password" lead="Choose a new password for this account.">
      {token ? (
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.confirm_password?.message}
            {...form.register('confirm_password')}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Update password
          </Button>
        </form>
      ) : (
        <p className="text-ink-2">
          This page needs a reset token from the email.{' '}
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      )}
    </AuthSplit>
  )
}
