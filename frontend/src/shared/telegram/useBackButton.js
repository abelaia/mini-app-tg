import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { backButton } from './telegram'

export function useBackButton() {
  const route = useRoute()
  const router = useRouter()
  const goBack = () => (window.history.state?.back ? router.back() : router.push(route.meta.back))
  watch(
    () => route.meta.back,
    (back) => (back ? backButton.show(goBack) : backButton.hide()),
    { immediate: true },
  )
}
