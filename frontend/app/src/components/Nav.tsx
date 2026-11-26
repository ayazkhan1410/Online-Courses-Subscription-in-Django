import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { buttonClass } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

const links = [
  { to: '/courses', label: 'Courses' },
  { to: '/categories', label: 'Categories' },
  { to: '/paths', label: 'Paths' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
]

function Item({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'inline-flex h-9 items-center rounded-control px-3 text-sm',
          isActive ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-raised hover:text-ink',
        )
      }
    >
      {label}
    </NavLink>
  )
}

export function Nav() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link to="/" className="text-base font-medium">
          Study with Ayaz
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Item key={link.to} {...link} />
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {token ? (
            <Link to="/dashboard" className={buttonClass('primary', 'sm')}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden h-9 items-center px-3 text-sm text-ink-2 sm:inline-flex">
                Log in
              </Link>
              <Link to="/courses" className={buttonClass('primary', 'sm')}>
                Start learning
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <Sheet open={open} title="Menu" onClose={() => setOpen(false)}>
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {links.map((link) => (
            <Item key={link.to} {...link} onClick={() => setOpen(false)} />
          ))}
          {token ? null : (
            <Link to="/login" className="inline-flex h-9 items-center px-3 text-sm" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </nav>
      </Sheet>
    </header>
  )
}
