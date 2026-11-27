import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { mqThumb } from '@/lib/youtubeThumb'

type ThumbnailWallProps = {
  urls: string[]
}

function splitRows(urls: string[]): [string[], string[], string[]] {
  const list = urls.filter(Boolean)
  if (list.length === 0) return [[], [], []]
  const a = list.slice(0, 5)
  const b = list.slice(5, 10).concat(list.slice(0, 2))
  const c = list.slice(2, 8)
  return [
    a.length ? a : list,
    b.length ? b : list,
    c.length ? c : list,
  ]
}

export function ThumbnailWall({ urls }: ThumbnailWallProps) {
  const reduced = useReducedMotion()
  const wallRef = useRef<HTMLDivElement | null>(null)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(reduced)
  const [r1, r2, r3] = splitRows(urls.map(mqThumb).filter(Boolean))

  useEffect(() => {
    if (reduced) return
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setReady(true))
      return () => win.cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(() => setReady(true), 200)
    return () => window.clearTimeout(timer)
  }, [reduced])

  useEffect(() => {
    const hero = wallRef.current?.closest('.home-hero')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting)
      },
      { threshold: 0.05 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const rowClass = reduced || paused ? 'row is-paused' : 'row'
  const showWall = ready || reduced

  return (
    <div className="home-wall" aria-hidden="true" ref={wallRef}>
      {showWall
        ? [r1, r2, r3].map((row, index) => (
            <div key={index} className={rowClass}>
              {[...row, ...row].map((src, i) => (
                <img
                  key={`${index}-${i}-${src}`}
                  src={src}
                  alt=""
                  width={280}
                  height={158}
                  loading="eager"
                  decoding="async"
                />
              ))}
            </div>
          ))
        : null}
    </div>
  )
}
