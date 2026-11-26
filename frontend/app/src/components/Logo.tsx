import { Link } from 'react-router-dom'

export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="2.5"
        width="17"
        height="19"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7.5 2.5v19" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 8h6M11 12h6"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo">
      <LogoMark />
      Study with Ayaz
    </Link>
  )
}
