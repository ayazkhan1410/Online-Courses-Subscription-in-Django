import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { Avatar } from '@/components/Avatar'
import { ErrorState } from '@/components/ErrorState'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function ProfilePage() {
  usePageTitle('Profile')
  const query = useQuery({ queryKey: ['me'], queryFn: getMe })
  if (query.isError) {
    return <ErrorState message={formatApiError(query.error)} onRetry={() => void query.refetch()} />
  }
  if (!query.data) return null
  const user = query.data
  const name = user.full_name || user.username
  return (
    <div>
      <h1 className="text-[32px]">Profile</h1>
      <div className="mt-8 flex items-center gap-4">
        <Avatar name={name} />
        <div>
          <p className="text-lg">{name}</p>
          <p className="text-sm text-ink-2">{user.email}</p>
        </div>
      </div>
      <dl className="mt-8 max-w-md space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-ink-2">Username</dt>
          <dd className="font-mono">{user.username}</dd>
        </div>
      </dl>
    </div>
  )
}
