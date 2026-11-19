<script setup>
import { computed, ref, useId } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import { http } from '@/shared/api/http'
import { prepareImage } from '@/shared/lib/imageUpload'

const props = defineProps({ modelValue: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'uploading'])
const inputId = useId()
const uploading = ref(false)
const error = ref('')
const preview = computed(() => props.modelValue?.url ? `${import.meta.env.VITE_API_URL ?? ''}${props.modelValue.url}` : '')
function update(key, value) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
async function upload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  error.value = ''; uploading.value = true; emit('uploading', true)
  try {
    const data = await http.upload('/api/admin/media', await prepareImage(file))
    emit('update:modelValue', { url: data.url, role: props.modelValue?.role ?? 'banner', fit: props.modelValue?.fit ?? 'contain' })
  } catch (cause) { error.value = cause.message || 'Не удалось загрузить картинку. Попробуйте ещё раз' }
  finally { uploading.value = false; emit('uploading', false); event.target.value = '' }
}
</script>

<template>
  <div class="artwork-editor">
    <label :for="inputId" class="field__label">Своя картинка</label>
    <p class="artwork-editor__hint">Любые пропорции. До 10 МБ. Большую картинку уменьшим автоматически; GIF сохранится как неподвижная картинка.</p>
    <input :id="inputId" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" :disabled="uploading" :aria-describedby="`${inputId}-status`" @change="upload" />
    <p :id="`${inputId}-status`" :class="['field__help', { 'field__help--error': error }]" aria-live="polite">{{ uploading ? 'Загружаем изображение…' : error }}</p>
    <template v-if="modelValue">
      <div :class="['artwork-editor__preview', `artwork-editor__preview--${modelValue.role}`]">
        <img :src="preview" alt="Предпросмотр картинки сериала" :style="{ objectFit: modelValue.fit }" />
      </div>
      <BaseField v-slot="{ attrs }" label="Использовать как"><select v-bind="attrs" class="field__input" :value="modelValue.role" @change="update('role', $event.target.value)"><option value="banner">Баннер</option><option value="icon">Иконка</option></select></BaseField>
      <BaseField v-slot="{ attrs }" label="Размещение"><select v-bind="attrs" class="field__input" :value="modelValue.fit" @change="update('fit', $event.target.value)"><option value="contain">Целиком, без обрезки</option><option value="cover">Заполнить область с обрезкой</option></select></BaseField>
      <BaseButton variant="ghost" size="sm" :disabled="uploading" @click="emit('update:modelValue', null)">Вернуть стандартную картинку</BaseButton>
      <p class="artwork-editor__hint">Картинка появится у участников после сохранения расписания.</p>
    </template>
  </div>
</template>

<style lang="scss">
.artwork-editor { display: flex; flex-direction: column; gap: 12px; padding-top: 16px; border-top: 1px solid var(--color-line); min-width: 0; }
.artwork-editor__hint { font-size: 12px; color: var(--color-ink-muted); }
.artwork-editor input[type='file'] { width: 100%; min-height: 44px; font: inherit; font-size: 12px; }
.artwork-editor input::file-selector-button { border: 0; border-radius: 10px; padding: 12px; margin-right: 8px; background: var(--color-sage-soft); color: var(--color-sage-deep); font: inherit; cursor: pointer; }
.artwork-editor__preview { aspect-ratio: 16/9; overflow: hidden; border-radius: 12px; background: var(--color-surface-muted); }
.artwork-editor__preview--icon { width: 100px; aspect-ratio: 1; }
.artwork-editor__preview img { display: block; width: 100%; height: 100%; }
</style>
