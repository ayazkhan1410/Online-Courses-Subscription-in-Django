import { useEffect, useRef, useState } from 'react'

type YTPlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
}

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string
      videoId: string
      width?: string | number
      height?: string | number
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (e: { target: YTPlayer }) => void
        onStateChange?: (e: { data: number; target: YTPlayer }) => void
      }
    },
  ) => YTPlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    const prior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prior?.()
      resolve()
    }
    if (!document.querySelector('script[data-yt-api]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.dataset.ytApi = '1'
      document.head.appendChild(script)
    }
    if (window.YT?.Player) resolve()
  })
  return apiPromise
}

export type YouTubePlayerControls = {
  seekTo: (seconds: number) => void
  play: () => void
  pause: () => void
  getCurrentTime: () => number
  getDuration: () => number
}

type Options = {
  videoId: string | null | undefined
  startSeconds?: number
  enabled?: boolean
  onTime?: (seconds: number, duration: number) => void
  onPause?: (seconds: number, duration: number) => void
  onPlayingChange?: (playing: boolean) => void
}

export function useYouTubePlayer(
  containerRef: React.RefObject<HTMLElement | null>,
  options: Options,
): YouTubePlayerControls | null {
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const optsRef = useRef(options)
  const startRef = useRef(options.startSeconds || 0)

  useEffect(() => {
    optsRef.current = options
  }, [options])

  useEffect(() => {
    startRef.current = options.startSeconds || 0
  }, [options.videoId, options.startSeconds])

  useEffect(() => {
    const videoId = options.videoId?.trim()
    const enabled = options.enabled !== false
    if (!videoId || !enabled || !containerRef.current) {
      playerRef.current?.destroy()
      playerRef.current = null
      setReady(false)
      return
    }

    let cancelled = false
    const mountEl = containerRef.current
    const start = Math.max(0, Math.floor(startRef.current))

    void loadYouTubeApi().then(() => {
      if (cancelled || !mountEl || !window.YT?.Player) return
      playerRef.current?.destroy()
      const player = new window.YT.Player(mountEl, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start,
        },
        events: {
          onReady: () => {
            if (cancelled) return
            setReady(true)
          },
          onStateChange: (event) => {
            const state = event.data
            const playing = state === window.YT!.PlayerState.PLAYING
            optsRef.current.onPlayingChange?.(playing)
            if (state === window.YT!.PlayerState.PAUSED) {
              const t = event.target.getCurrentTime()
              const d = event.target.getDuration()
              optsRef.current.onPause?.(t, d)
            }
          },
        },
      })
      playerRef.current = player
    })

    const tick = window.setInterval(() => {
      const player = playerRef.current
      if (!player || !window.YT) return
      try {
        if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) return
        optsRef.current.onTime?.(player.getCurrentTime(), player.getDuration())
      } catch {
        /* player not ready */
      }
    }, 1000)

    return () => {
      cancelled = true
      window.clearInterval(tick)
      playerRef.current?.destroy()
      playerRef.current = null
      setReady(false)
    }
  }, [options.videoId, options.enabled, containerRef])

  if (!ready) return null

  return {
    seekTo: (seconds: number) => {
      playerRef.current?.seekTo(seconds, true)
    },
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    getDuration: () => playerRef.current?.getDuration() ?? 0,
  }
}
