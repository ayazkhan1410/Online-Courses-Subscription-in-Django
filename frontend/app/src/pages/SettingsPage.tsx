import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { updateSettings } from '@/api/auth'
import { formatApiError } from '@/api/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function SettingsPage() {
  usePageTitle('Settings')
  const { user, setSession, token } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const privacy = useMutation({
    mutationFn: (show_name_on_completion: boolean) =>
      updateSettings({ show_name_on_completion }),
    onSuccess: (nextUser) => {
      if (token) setSession(token, nextUser)
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  return (
    <div>
      <h1 className="text-[32px]">Settings</h1>
      <div className="mt-8 max-w-lg rounded-card border border-line bg-surface p-5">
        <p className="text-sm text-ink-2">Theme</p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
        <label className="mt-6 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={user?.show_name_on_completion ?? true}
            disabled={privacy.isPending}
            onChange={(event) => privacy.mutate(event.target.checked)}
          />
          Show my name on completion cards
        </label>
        <p className="mt-6 text-sm text-ink-2">Signed in as {user?.email}</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/dashboard/security">Security</Link>
          <Link to="/forgot-password">Reset password by email</Link>
        </div>
      </div>
    </div>
  )
}
