import {
  BookOpen,
  Bookmark,
  Grid3x3,
  Home,
  LayoutList,
  LogOut,
  Menu,
  StickyNote,
  Settings,
  Shield,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Sheet } from '@/components/Sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

function userInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function SideItem({
  to,
  end,
  icon: Icon,
  children,
  meta,
  onNavigate,
}: {
  to: string
  end?: boolean
  icon: typeof Home
  children: React.ReactNode
  meta?: React.ReactNode
  onNavigate?: () => void
}) {
  return (
    <NavLink to={to} end={end} className="item" onClick={onNavigate}>
      <Icon size={18} strokeWidth={1.5} aria-hidden />
      {children}
      {meta ? <span className="meta">{meta}</span> : null}
    </NavLink>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.full_name || user?.username || 'Student'
  const email = user?.email ?? ''

  return (
    <aside className="side">
      <Logo />
      <nav className="side-group" aria-label="Learning">
        <SideItem to="/dashboard" end icon={Home} onNavigate={onNavigate}>
          Home
        </SideItem>
        <SideItem to="/dashboard/courses" icon={BookOpen} onNavigate={onNavigate}>
          My courses
        </SideItem>
        <SideItem to="/dashboard/saved" icon={Bookmark} onNavigate={onNavigate}>
          Saved
        </SideItem>
        <SideItem to="/dashboard/notes" icon={StickyNote} onNavigate={onNavigate}>
          Notes
        </SideItem>
      </nav>
      <nav className="side-group" aria-label="Browse">
        <div className="side-label">Browse</div>
        <SideItem to="/courses" icon={Grid3x3} onNavigate={onNavigate}>
          All courses
        </SideItem>
        <SideItem to="/categories" icon={LayoutList} onNavigate={onNavigate}>
          Categories
        </SideItem>
      </nav>
      <nav className="side-group" aria-label="Account">
        <div className="side-label">Account</div>
        <SideItem to="/dashboard/profile" icon={UserRound} onNavigate={onNavigate}>
          Profile
        </SideItem>
        <SideItem to="/dashboard/settings" icon={Settings} onNavigate={onNavigate}>
          Settings
        </SideItem>
        <SideItem to="/dashboard/security" icon={Shield} onNavigate={onNavigate}>
          Security
        </SideItem>
        <button
          type="button"
          className="item"
          onClick={() => {
            onNavigate?.()
            void logout().then(() => navigate('/'))
          }}
        >
          <LogOut size={18} strokeWidth={1.5} aria-hidden />
          Log out
        </button>
      </nav>
      <div className="side-foot">
        <span className="avatar avatar-lg">{userInitials(name, email)}</span>
        <div className="who">
          <div>{name}</div>
          <div>{email}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

export function DashboardLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="app">
      <Sidebar />
      <div>
        <div className="mob-top">
          <Link className="logo" to="/">
            Study with Ayaz
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <Sheet open={open} title="Dashboard" onClose={() => setOpen(false)}>
        <Sidebar onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}