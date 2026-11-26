import { PageHeader, PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PrivacyPage() {
  usePageTitle('Privacy')
  return (
    <PageMain>
      <PageHeader title="Privacy" lead="What this app stores." />
      <div className="max-w-2xl space-y-4 text-ink-2">
        <p>
          An account stores your name, email, enrollments, wishlist, and which lessons
          you mark complete. Passwords are stored as hashes.
        </p>
        <p>
          Card details are sent to Stripe during Pro checkout. This app stores the
          membership result, not the card number.
        </p>
        <p>
          Contact messages are kept so they can be answered. Sign-in can require a
          one-time code when two-factor authentication is on.
        </p>
      </div>
    </PageMain>
  )
}
