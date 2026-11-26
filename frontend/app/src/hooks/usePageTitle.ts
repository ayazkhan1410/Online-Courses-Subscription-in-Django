import { useEffect } from 'react'

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — Study with Ayaz`
  }, [title])
}
