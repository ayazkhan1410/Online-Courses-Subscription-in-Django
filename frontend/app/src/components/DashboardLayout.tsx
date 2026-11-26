import {
  BookOpen,
  Bookmark,
  Award,
  Bell,
  Gauge,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Sheet } from '@/components/Sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

const links = [
  { to: '/dashboard', label: 'Overview', icon: Gauge, end: true },
  { to: '/dashboard/courses', label: 'Courses', icon: BookOpen, end: false },
  { to: '/dashboard/progress', label: 'Progress', icon: LineChart, end: false },
  { to: '/dashboard/saved', label: 'Saved', icon: Bookmark, end: false },
  { to: '/dashboard/certificates', label: 'Certificates', icon: Award, end: false },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/dashboard/security', label: 'Security', icon: Shield, end: false },
]

function SideLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-2 rounded-control px-3 text-sm',
                isActive ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-raised',
              )
            }
          >
            <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
            {link.label}
          </NavLink>
        )
      })}
      <button
        type="button"
        className="mt-4 flex h-9 items-center gap-2 rounded-control px-3 text-left text-sm text-ink-2 hover:bg-raised"
        onClick={() => {
          void logout().then(() => navigate('/'))
        }}
      >
        <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
        Log out
      </button>
    </nav>
  )
}

export function DashboardLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
      <aside className="hidden w-64 shrink-0 border-r border-line px-3 py-6 lg:block">
        <p className="mb-4 px-3 text-sm font-medium">Study with Ayaz</p>
        <SideLinks />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control"
            aria-label="Open dashboard menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          <p className="text-sm font-medium">Dashboard</p>
        </div>
        <div className="px-4 py-6 md:px-6">
          <Outlet />
        </div>
      </div>
      <Sheet open={open} title="Dashboard" onClose={() => setOpen(false)}>
        <SideLinks onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
