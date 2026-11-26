import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/Button'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PaymentSuccessPage() {
  usePageTitle('Payment')
  return (
    <PageMain>
      <h1>Payment submitted</h1>
      <p className="mt-3 max-w-xl text-ink-2">
        If the charge went through, Pro is active on your account.
      </p>
      <Link to="/dashboard" className={buttonClass('primary', 'md', 'mt-6')}>
        Go to dashboard
      </Link>
    </PageMain>
  )
}
