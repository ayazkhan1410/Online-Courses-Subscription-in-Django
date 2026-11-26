import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Learn',
    links: [
      { to: '/courses', label: 'Courses' },
      { to: '/categories', label: 'Categories' },
      { to: '/paths', label: 'Paths' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { to: '/services', label: 'Services' },
      { to: '/work', label: 'Work' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log in' },
      { to: '/register', label: 'Register' },
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Notes',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm text-ink-2">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm hover:text-ink-2">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-8 text-sm text-ink-3 md:px-6">
        Study with Ayaz
      </div>
    </footer>
  )
}
