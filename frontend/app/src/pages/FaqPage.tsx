import { Accordion } from '@/components/Accordion'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

const items = [
  {
    id: 'enroll',
    title: 'How do I enroll?',
    body: 'Open a course and choose Enroll. The lessons open after that.',
  },
  {
    id: 'mfa',
    title: 'How do I turn on two-factor authentication?',
    body: 'Open Security in the dashboard, scan the authenticator setup, and confirm a 6-digit code. Save the recovery codes. Each code works once.',
  },
  {
    id: 'password',
    title: 'I forgot my password',
    body: 'Use the forgot password form. If the email is registered, a reset link is sent. The link opens the reset page with a token.',
  },
  {
    id: 'reviews',
    title: 'Where are the reviews?',
    body: 'There are none. This site does not publish testimonials or ratings.',
  },
]

export default function FaqPage() {
  usePageTitle('FAQ')
  return (
    <PageMain>
      <PageHeader title="FAQ" lead="How accounts and lessons work." />
      <Accordion items={items} />
    </PageMain>
  )
}
