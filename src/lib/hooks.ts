import { useCallback, useEffect, useRef, useState } from 'react'
import { backendNow } from '../services/backend'

/** Moves focus to a named element after the next render, once it exists. */
export function useFocusRegistry() {
  const nodes = useRef(new Map<string, HTMLElement | null>())
  const [request, setRequest] = useState<{ name: string; count: number } | null>(null)

  useEffect(() => {
    if (request) nodes.current.get(request.name)?.focus()
  }, [request])

  const register = useCallback(
    (name: string) => (element: HTMLElement | null) => {
      nodes.current.set(name, element)
    },
    [],
  )

  const focus = useCallback((name: string) => {
    setRequest((previous) => ({ name, count: (previous?.count ?? 0) + 1 }))
  }, [])

  return { register, focus }
}

/** Current prototype time (includes the dev clock offset), refreshed on an interval. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => backendNow())

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(backendNow()), intervalMs)
    return () => window.clearInterval(timer)
  }, [active, intervalMs])

  // Re-read the clock on every render so a skipped dev clock shows immediately.
  return active ? Math.max(now, backendNow()) : now
}

export const SUCCESS_NOTICE_MS = 8000

/** Calls `onExpire` a few seconds after `active` becomes true. */
export function useAutoDismiss(active: boolean, onExpire: () => void, delayMs = SUCCESS_NOTICE_MS) {
  const callback = useRef(onExpire)
  useEffect(() => {
    callback.current = onExpire
  })

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => callback.current(), delayMs)
    return () => window.clearTimeout(timer)
  }, [active, delayMs])
}
