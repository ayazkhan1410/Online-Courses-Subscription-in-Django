import { Component, lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const DeskScene = lazy(() => import('@/features/hero/DeskScene'))

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function Fallback() {
  return (
    <img
      src="/hero-desk.svg"
      alt="Open paper notebook and a laptop on a night desk"
      className="h-full w-full object-contain"
    />
  )
}

class SceneBoundary extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(): void {
    this.props.onFail()
  }

  render() {
    if (this.state.failed) return <Fallback />
    return this.props.children
  }
}

export function HeroCanvas() {
  const reduced = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 767px)')
  const [failed, setFailed] = useState(() => !canUseWebGL())
  const pointer = useRef({ x: 0, y: 0 })

  if (reduced || narrow || failed) {
    return (
      <div className="h-[320px] md:h-[520px]">
        <Fallback />
      </div>
    )
  }

  return (
    <div
      className="h-[320px] md:h-[520px]"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointer.current = {
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
        }
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 }
      }}
    >
      <SceneBoundary onFail={() => setFailed(true)}>
        <Suspense fallback={<Fallback />}>
          <DeskScene pointer={pointer} />
        </Suspense>
      </SceneBoundary>
    </div>
  )
}
