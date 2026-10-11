import { ref } from 'vue'

const toasts = ref([])
let seed = 0

function dismiss(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function show(text, { tone = 'default', duration = 2600 } = {}) {
  const id = ++seed
  toasts.value = [...toasts.value.slice(-1), { id, text, tone }]
  window.setTimeout(() => dismiss(id), duration)
}

export function useToast() {
  return { toasts, show, dismiss }
}
