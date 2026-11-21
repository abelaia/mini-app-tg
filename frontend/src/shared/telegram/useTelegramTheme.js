import { ref } from 'vue'
import { colorScheme, onThemeChange, paintChrome } from './telegram'

const theme = ref('light')
const STORAGE_KEY = 'turkdizi-theme'
let initialized = false
let preference = null

function savedTheme(value) {
    return value === 'light' || value === 'dark' ? value : null
}

function apply() {
    const root = document.documentElement
    root.dataset.theme = theme.value
    const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim()
    paintChrome(bg)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

function setTheme(next) {
    if (next !== 'light' && next !== 'dark') return
    preference = next
    theme.value = next
    apply()
    try {
        localStorage.setItem(STORAGE_KEY, next)
    } catch {
        /* Theme still works when storage is unavailable. */
    }
}

function syncTheme() {
    theme.value = preference ?? colorScheme()
    apply()
}

export function useTelegramTheme() {
    if (!initialized) {
        initialized = true
        try {
            preference = savedTheme(localStorage.getItem(STORAGE_KEY))
        } catch {
            preference = null
        }
        syncTheme()
        onThemeChange(syncTheme)
        window.addEventListener('storage', (event) => {
            if (event.key !== STORAGE_KEY && event.key !== null) return
            preference = savedTheme(event.newValue)
            syncTheme()
        })
    }
    return { theme, setTheme }
}
