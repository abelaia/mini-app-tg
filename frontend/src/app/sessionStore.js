import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'

export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  // Локально сразу считаем админом, чтобы вкладка и /#/admin открывались без танцев.
  const isAdmin = ref(Boolean(import.meta.env.DEV))
  const status = ref('idle')
  const backendUp = ref(false)

  const ready = computed(() => status.value === 'ready')

  async function start() {
    status.value = 'loading'
    try {
      const data = await http.post('/api/session')
      user.value = data?.user ?? data ?? null
      isAdmin.value = Boolean(data?.isAdmin) || Boolean(import.meta.env.DEV)
      backendUp.value = true
      status.value = 'ready'
    } catch {
      user.value = null
      isAdmin.value = Boolean(import.meta.env.DEV)
      backendUp.value = false
      status.value = 'ready'
      if (import.meta.env.DEV) {
        console.warn('[session] /api/session недоступен — запусти бэкенд: cd backend && go run ./cmd/server')
      }
    }
  }

  return { user, isAdmin, status, ready, backendUp, start }
})
