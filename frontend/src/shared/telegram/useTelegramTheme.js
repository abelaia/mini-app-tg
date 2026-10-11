import { ref } from 'vue'
import { colorScheme, onThemeChange, paintChrome } from './telegram'

const theme = ref('light')

function apply() {
  theme.value = colorScheme()
  const root = document.documentElement
  root.dataset.theme = theme.value
  const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim()
  paintChrome(bg)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

export function useTelegramTheme() {
  apply()
  onThemeChange(apply)
  return { theme }
}
