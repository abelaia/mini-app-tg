const tg = window.Telegram?.WebApp ?? null

const supports = (version) => Boolean(tg?.isVersionAtLeast?.(version))

let writeAccess = Boolean(tg?.initDataUnsafe?.user?.allows_write_to_pm)

export const initData = tg?.initData ?? ''

export const isTelegram = initData !== ''

export const tgUser = tg?.initDataUnsafe?.user ?? null

export const startParam = tg?.initDataUnsafe?.start_param ?? ''

export function setupTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  if (supports('7.7')) tg.disableVerticalSwipes()
}

export function colorScheme() {
  if (isTelegram && tg.colorScheme) return tg.colorScheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function onThemeChange(callback) {
  if (isTelegram) tg.onEvent('themeChanged', callback)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback)
}

export function paintChrome(color) {
  if (!isTelegram || !color) return
  if (supports('6.1')) {
    tg.setHeaderColor(color)
    tg.setBackgroundColor(color)
  }
  if (supports('7.10')) tg.setBottomBarColor(color)
}

export const haptic = {
  tap: () => supports('6.1') && tg.HapticFeedback.impactOccurred('light'),
  select: () => supports('6.1') && tg.HapticFeedback.selectionChanged(),
  success: () => supports('6.1') && tg.HapticFeedback.notificationOccurred('success'),
  warning: () => supports('6.1') && tg.HapticFeedback.notificationOccurred('warning'),
  error: () => supports('6.1') && tg.HapticFeedback.notificationOccurred('error'),
}

export function openLink(url) {
  if (!isTelegram) {
    window.open(url, '_blank', 'noopener')
    return
  }
  if (url.startsWith('https://t.me/')) tg.openTelegramLink(url)
  else tg.openLink(url)
}

export function confirm(message) {
  if (!isTelegram || !supports('6.2')) return Promise.resolve(window.confirm(message))
  return new Promise((resolve) => tg.showConfirm(message, (ok) => resolve(Boolean(ok))))
}

export function requestWriteAccess() {
  if (writeAccess || !isTelegram || !supports('6.9')) return Promise.resolve(true)
  return new Promise((resolve) => {
    tg.requestWriteAccess((granted) => {
      writeAccess = Boolean(granted)
      resolve(writeAccess)
    })
  })
}

export const backButton = {
  show(handler) {
    if (!isTelegram || !supports('6.1')) return
    tg.BackButton.offClick(backButton.handler)
    backButton.handler = handler
    tg.BackButton.onClick(handler)
    tg.BackButton.show()
  },
  hide() {
    if (!isTelegram || !supports('6.1')) return
    tg.BackButton.offClick(backButton.handler)
    tg.BackButton.hide()
  },
  handler: null,
}
