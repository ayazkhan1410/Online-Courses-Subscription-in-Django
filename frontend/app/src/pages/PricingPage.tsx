import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatApiError } from '@/api/client'
import { getPlans } from '@/api/membership'
import { buttonClass } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader, PageMain } from '@/components/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PricingPage() {
  usePageTitle('Pricing')
  const { token } = useAuth()
  const query = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    enabled: Boolean(token),
  })

  return (
    <PageMain>
      <PageHeader
        title="Pricing"
        lead="Pro unlocks premium courses. Prices come from the membership list."
      />
      {!token ? (
        <EmptyState
          title="Plans are shown after you log in"
          body="The price list is tied to your account."
          actionLabel="Log in"
          to="/login?next=%2Fpricing"
        />
      ) : null}
      {query.isError ? (
        <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState
          title="No plans are listed yet"
          body="There is nothing to purchase right now."
          actionLabel="Contact"
          to="/contact"
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {query.data.map((plan) => (
            <li key={plan.id} className="rounded-card border border-line bg-surface p-5">
              <h2 className="text-xl">{plan.subscription_list}</h2>
              <p className="mt-3 font-mono text-[32px] tabular-nums">{plan.subscription_price}</p>
              <Link to="/pro" className={buttonClass('primary', 'md', 'mt-6')}>
                Continue
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageMain>
  )
}
