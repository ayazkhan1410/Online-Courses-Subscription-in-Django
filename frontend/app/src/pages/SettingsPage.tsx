import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function SettingsPage() {
  usePageTitle('Settings')
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-[32px]">Settings</h1>
      <div className="mt-8 max-w-lg rounded-card border border-line bg-surface p-5">
        <p className="text-sm text-ink-2">Theme</p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
        <p className="mt-6 text-sm text-ink-2">Signed in as {user?.email}</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/dashboard/security">Security</Link>
          <Link to="/forgot-password">Reset password by email</Link>
        </div>
      </div>
    </div>
  )
}
