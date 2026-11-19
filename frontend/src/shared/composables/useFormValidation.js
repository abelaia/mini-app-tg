import { computed, nextTick, ref } from 'vue'

export function useFormValidation(validate) {
  const touched = ref(new Set())
  const submitted = ref(false)
  const errors = computed(validate)
  const touch = (name) => { touched.value = new Set(touched.value).add(name) }
  const error = (name) => submitted.value || touched.value.has(name) ? errors.value[name] ?? '' : ''
  function reset() { touched.value = new Set(); submitted.value = false }
  async function check(container) {
    submitted.value = true
    await nextTick()
    if (!Object.keys(errors.value).length) return true
    const first = container?.querySelector('[aria-invalid="true"]')
    first?.focus()
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }
  return { errors, error, touch, check, reset }
}
