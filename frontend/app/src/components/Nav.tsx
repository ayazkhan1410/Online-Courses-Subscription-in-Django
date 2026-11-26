import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Sheet } from '@/components/Sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

const links = [
  { to: '/courses', label: 'Courses' },
  { to: '/categories', label: 'Categories' },
  { to: '/paths', label: 'Paths' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
]

export function Nav() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              aria-current={undefined}
            >
              {({ isActive }) => (
                <span aria-current={isActive ? 'page' : undefined}>{link.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav-end">
          <ThemeToggle />
          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Log in
              </Link>
              <Link to="/courses" className="btn btn-primary btn-sm">
                Start learning
              </Link>
            </>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-icon nav-menu"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="i" size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <Sheet open={open} title="Menu" onClose={() => setOpen(false)}>
        <nav aria-label="Mobile" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {token ? null : (
            <Link to="/login" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </nav>
      </Sheet>
    </header>
  )
}
