import { EmptyState } from '@/components/EmptyState'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotificationsPage() {
  usePageTitle('Notifications')
  return (
    <EmptyState
      title="No notifications"
      body="This account does not have a notification list yet."
      actionLabel="Browse courses"
      to="/courses"
    />
  )
}
