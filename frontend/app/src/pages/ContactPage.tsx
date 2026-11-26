import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { sendContact } from '@/api/contact'
import { formatApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { Textarea } from '@/components/Textarea'
import { useToast } from '@/components/Toast'
import { TurnstileWidget, type TurnstileHandle } from '@/components/TurnstileWidget'
import { usePageTitle } from '@/hooks/usePageTitle'
import { contactSchema, type ContactValues } from '@/lib/schemas'

export default function ContactPage() {
  usePageTitle('Contact')
  const toast = useToast()
  const turnstile = useRef<TurnstileHandle>(null)
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
  })

  async function onSubmit(values: ContactValues, token: string) {
    try {
      await sendContact({
        ...values,
        turnstile_token: token,
      })
      toast.push('Message sent')
      form.reset()
    } catch (error) {
      turnstile.current?.reset()
      toast.push(formatApiError(error), 'err')
    }
  }

  return (
    <PageMain>
      <PageHeader title="Contact" lead="Send a note about a course or a project." />
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={(event) => {
          const token = turnstile.current?.getToken() ?? ''
          void form.handleSubmit((values) => onSubmit(values, token))(event)
        }}
      >
        <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
        <Input
          label="Email"
          type="email"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <Textarea
          label="Message"
          error={form.formState.errors.message?.message}
          {...form.register('message')}
        />
        <TurnstileWidget ref={turnstile} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Send message
        </Button>
      </form>
    </PageMain>
  )
}
