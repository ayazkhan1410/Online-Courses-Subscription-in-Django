/** Quiet wake notice when the free Render API is cold-starting. */

type Listener = (waking: boolean) => void

let waking = false
const listeners = new Set<Listener>()

export function isApiWaking(): boolean {
  return waking
}

export function setApiWaking(next: boolean): void {
  if (waking === next) return
  waking = next
  listeners.forEach((listener) => listener(waking))
}

export function subscribeApiWake(listener: Listener): () => void {
  listeners.add(listener)
  listener(waking)
  return () => {
    listeners.delete(listener)
  }
}
