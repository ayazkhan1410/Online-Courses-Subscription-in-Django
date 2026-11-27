import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/** Light CSS fade for route changes — avoids shipping motion on every page. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <div className={reduced ? undefined : 'page-enter'}>{children}</div>
  )
}
