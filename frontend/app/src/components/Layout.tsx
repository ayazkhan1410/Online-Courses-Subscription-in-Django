import { useLocation, Outlet } from 'react-router-dom'
import { ApiWakeNotice } from '@/components/ApiWakeNotice'
import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { PageTransition } from '@/components/PageTransition'

export function Layout() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="flex-1">
        <ApiWakeNotice />
        <PageTransition key={location.pathname}>{<Outlet />}</PageTransition>
      </main>
      <Footer />
    </div>
  )
}
