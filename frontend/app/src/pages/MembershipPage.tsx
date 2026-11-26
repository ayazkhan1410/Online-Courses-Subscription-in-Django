import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function MembershipPage() {
  usePageTitle('Membership')
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-[32px]">Membership</h1>
      <p className="mt-3 text-ink-2">
        {user?.is_pro ? 'Pro is active on this account.' : 'This account is on the free catalog.'}
      </p>
      <Link
        to={user?.is_pro ? '/courses' : '/pro'}
        className={buttonClass('primary', 'md', 'mt-6')}
      >
        {user?.is_pro ? 'Browse courses' : 'See Pro'}
      </Link>
    </div>
  )
}
