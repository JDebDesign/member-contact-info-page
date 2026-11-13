import { setThemePreference, useTheme, type ThemePreference } from '../lib/theme'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { preference, resolved } = useTheme()
  return (
    <fieldset className="theme-toggle">
      <legend className="bold">Color mode</legend>
      <div className="theme-toggle__options">
        {OPTIONS.map((option) => (
          <label key={option.value} className="theme-toggle__option">
            <input
              type="radio"
              name="theme-preference"
              value={option.value}
              checked={preference === option.value}
              onChange={() => setThemePreference(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <p className="small muted">
        {preference === 'system' ? `Following your device, currently ${resolved}.` : `Fixed to ${resolved}.`}
      </p>
    </fieldset>
  )
}
