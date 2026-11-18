import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'

const devAdmin = () => import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN === '1'

export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  const isAdmin = ref(devAdmin())
  const status = ref('idle')
  const backendUp = ref(false)

  const ready = computed(() => status.value === 'ready')

  async function start() {
    status.value = 'loading'
    try {
      const data = await http.post('/api/session')
      user.value = data?.user ?? data ?? null
      isAdmin.value = Boolean(data?.isAdmin) || devAdmin()
      backendUp.value = true
      status.value = 'ready'
    } catch {
      user.value = null
      isAdmin.value = devAdmin()
      backendUp.value = false
      status.value = 'ready'
      if (import.meta.env.DEV) {
        console.warn('[session] /api/session недоступен — запусти бэкенд: cd backend && go run ./cmd/server')
      }
    }
  }

  return { user, isAdmin, status, ready, backendUp, start }
})
