import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'

export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  const isAdmin = ref(false)
  const status = ref('idle')

  const ready = computed(() => status.value === 'ready')

  async function start() {
    status.value = 'loading'
    try {
      const data = await http.post('/api/session')
      user.value = data?.user ?? data ?? null
      isAdmin.value = Boolean(data?.isAdmin)
      status.value = 'ready'
    } catch {
      user.value = null
      isAdmin.value = false
      status.value = 'ready'
    }
  }

  return { user, isAdmin, status, ready, start }
})
