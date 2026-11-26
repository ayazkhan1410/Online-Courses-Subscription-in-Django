import { useMediaQuery } from '@/hooks/useMediaQuery'

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
