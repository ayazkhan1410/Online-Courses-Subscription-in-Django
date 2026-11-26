import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/Button'
import { PageMain } from '@/components/PageHeader'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PaymentFailedPage() {
  usePageTitle('Payment')
  return (
    <PageMain>
      <h1>Payment did not complete</h1>
      <p className="mt-3 max-w-xl text-ink-2">
        The membership was not changed. You can try the card again.
      </p>
      <Link to="/pro" className={buttonClass('primary', 'md', 'mt-6')}>
        Back to Pro
      </Link>
    </PageMain>
  )
}
