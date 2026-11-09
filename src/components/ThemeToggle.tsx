import { useState } from 'react'
import { applyTheme, saveTheme, type Theme } from '../theme'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) ?? 'light',
  )

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveTheme(next)
    setTheme(next)
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button className="icon-button" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
