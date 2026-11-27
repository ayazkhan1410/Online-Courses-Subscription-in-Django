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
  const settings = useMutation({
    mutationFn: updateSettings,
    onSuccess: (nextUser) => {
      if (token) setSession(token, nextUser)
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => toast.push(formatApiError(error), 'err'),
  })

  const dailyGoal = user?.daily_goal ?? 1

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
            disabled={settings.isPending}
            onChange={(event) =>
              settings.mutate({ show_name_on_completion: event.target.checked })
            }
          />
          Show my name on completion cards
        </label>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={user?.weekly_email ?? false}
            disabled={settings.isPending}
            onChange={(event) =>
              settings.mutate({ weekly_email: event.target.checked })
            }
          />
          Weekly reminder email
        </label>
        <div className="mt-6">
          <p className="text-sm text-ink-2">Daily lesson goal</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`btn btn-sm${dailyGoal === n ? ' btn-primary' : ''}`}
                disabled={settings.isPending}
                onClick={() => settings.mutate({ daily_goal: n })}
              >
                {n} {n === 1 ? 'lesson' : 'lessons'}
              </button>
            ))}
          </div>
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
