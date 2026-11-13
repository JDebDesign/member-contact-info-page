import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '../components/ThemeToggle'
import { initTheme, setThemePreference } from './theme'

function mockDevice(prefersDark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: prefersDark,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', () => query)
  return {
    change(next: boolean) {
      query.matches = next
      listeners.forEach((listener) => listener())
    },
  }
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme', () => {
  it('follows the device by default', () => {
    mockDevice(true)
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('updates when the device changes while set to device', () => {
    const device = mockDevice(false)
    initTheme()
    setThemePreference('system')
    expect(document.documentElement.dataset.theme).toBe('light')
    act(() => device.change(true))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('ignores device changes once a mode is chosen manually', () => {
    const device = mockDevice(false)
    initTheme()
    setThemePreference('light')
    act(() => device.change(true))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('lets the toggle choose device, light or dark and remembers it', async () => {
    mockDevice(false)
    initTheme()
    const user = userEvent.setup()
    render(<ThemeToggle />)

    expect(screen.getByRole('radio', { name: 'Device' })).toBeChecked()
    expect(screen.getByText('Following your device, currently light.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('mci-theme-preference')).toBe('dark')
    expect(screen.getByText('Fixed to dark.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(screen.getByRole('radio', { name: 'Device' }))
    expect(localStorage.getItem('mci-theme-preference')).toBe('system')
  })
})
