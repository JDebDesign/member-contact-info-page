import { useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
}

const STORAGE_KEY = 'mci-theme-preference'
const listeners = new Set<() => void>()

function deviceMedia(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return deviceMedia()?.matches ? 'dark' : 'light'
}

let state: ThemeState = { preference: 'system', resolved: 'light' }

function commit(preference: ThemePreference) {
  const resolved = resolve(preference)
  document.documentElement.dataset.theme = resolved
  if (state.preference === preference && state.resolved === resolved) return
  state = { preference, resolved }
  listeners.forEach((listener) => listener())
}

/** Applies the saved preference and follows device changes while the preference is "system". */
export function initTheme() {
  commit(readStoredPreference())
  deviceMedia()?.addEventListener('change', () => {
    if (state.preference === 'system') commit('system')
  })
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
  commit(preference)
}

export function useTheme(): ThemeState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
