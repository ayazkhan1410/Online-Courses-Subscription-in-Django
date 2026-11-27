import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Not found')

  return (
    <div className="not-found-page">
      <div className="not-found-sheet">
        <div className="not-found-margin" aria-hidden="true" />
        <p className="not-found-code mono">404</p>
        <h1 className="h1">This page isn&apos;t in the notebook</h1>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/courses">
            Browse courses
          </Link>
          <Link className="btn" to="/">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}