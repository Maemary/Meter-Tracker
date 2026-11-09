export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// Saved choice first; otherwise follow the device setting
export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage blocked (e.g. private mode): fall back to the device setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// <html data-theme="dark"> switches every colour variable in index.css
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // not saved, but the toggle still works for this visit
  }
}
