import { ref } from 'vue'
import { onThemeChange, paintChrome } from './telegram'

const theme = ref('light')
const STORAGE_KEY = 'turkdizi-theme'
let initialized = false

function apply() {
  const root = document.documentElement
  root.dataset.theme = theme.value
  const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim()
  paintChrome(bg)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

function setTheme(next) {
  if (next !== 'light' && next !== 'dark') return
  theme.value = next
  apply()
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* Theme still works when storage is unavailable. */ }
}

export function useTelegramTheme() {
  if (!initialized) {
    initialized = true
    try {
      theme.value = localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
    } catch { theme.value = 'light' }
    apply()
    // Telegram may repaint its chrome; keep the user's explicit app preference.
    onThemeChange(apply)
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return
      theme.value = event.newValue === 'dark' ? 'dark' : 'light'
      apply()
    })
  }
  return { theme, setTheme }
}
