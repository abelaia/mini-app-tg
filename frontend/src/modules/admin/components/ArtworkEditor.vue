<script setup>
    import { computed, ref, useId } from 'vue'
    import BaseButton from '@/shared/ui/BaseButton.vue'
    import { http } from '@/shared/api/http'
    import { artworkPlacement, artworkTransform } from '@/shared/lib/artworkFrame'
    import { prepareImage } from '@/shared/lib/imageUpload'

    const props = defineProps({ modelValue: { type: Object, default: null } })
    const emit = defineEmits(['update:modelValue', 'uploading'])
    const inputId = useId()
    const uploading = ref(false)
    const error = ref('')
    const frame = ref(null)
    const preview = computed(() =>
        props.modelValue?.url ? `${import.meta.env.VITE_API_URL ?? ''}${props.modelValue.url}` : '',
    )
    const placement = computed(() => artworkPlacement(props.modelValue))
    const frameStyle = computed(() => artworkTransform(props.modelValue))

    function commit(partial) {
        const next = artworkPlacement({ ...props.modelValue, ...partial })
        emit('update:modelValue', {
            url: props.modelValue.url,
            role: 'icon',
            fit: 'cover',
            ...next,
        })
    }

    async function upload(event) {
        const file = event.target.files?.[0]
        if (!file) return
        error.value = ''
        uploading.value = true
        emit('uploading', true)
        try {
            const data = await http.upload('/api/admin/media', await prepareImage(file))
            emit('update:modelValue', {
                url: data.url,
                role: 'icon',
                fit: 'cover',
                zoom: 1,
                stretch: 1,
                x: 0,
                y: 0,
            })
        } catch (cause) {
            error.value = cause.message || 'Не удалось загрузить картинку. Попробуйте ещё раз'
        } finally {
            uploading.value = false
            emit('uploading', false)
            event.target.value = ''
        }
    }

    const drag = ref(null)
    function onPointerDown(event) {
        if (!frame.value) return
        frame.value.setPointerCapture(event.pointerId)
        drag.value = {
            x: event.clientX,
            y: event.clientY,
            ox: placement.value.x,
            oy: placement.value.y,
        }
    }
    function onPointerMove(event) {
        if (!drag.value || !frame.value) return
        const width = frame.value.clientWidth || 1
        const height = frame.value.clientHeight || 1
        commit({
            x: drag.value.ox + ((event.clientX - drag.value.x) / width) * 100,
            y: drag.value.oy + ((event.clientY - drag.value.y) / height) * 100,
        })
    }
    function onPointerUp() {
        drag.value = null
    }
    function onWheel(event) {
        commit({ zoom: placement.value.zoom + (event.deltaY < 0 ? 0.08 : -0.08) })
    }
</script>

<template>
    <div class="artwork-editor">
        <label
            :for="inputId"
            class="field__label"
            >Иконка сериала</label
        >
        <p class="artwork-editor__hint">
            Квадрат, как в расписании. До 10 МБ. Большую картинку уменьшим автоматически; GIF
            сохранится как неподвижная картинка.
        </p>
        <input
            :id="inputId"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            :disabled="uploading"
            :aria-describedby="`${inputId}-status`"
            @change="upload"
        />
        <p
            :id="`${inputId}-status`"
            :class="['field__help', { 'field__help--error': error }]"
            aria-live="polite"
        >
            {{ uploading ? 'Загружаем изображение…' : error }}
        </p>
        <template v-if="modelValue">
            <div class="artwork-editor__stage">
                <div
                    ref="frame"
                    class="artwork-editor__frame"
                    role="application"
                    aria-label="Кадр иконки. Тяните картинку, чтобы сдвинуть её. Колёсико приближает."
                    @pointerdown="onPointerDown"
                    @pointermove="onPointerMove"
                    @pointerup="onPointerUp"
                    @pointercancel="onPointerUp"
                    @wheel.prevent="onWheel"
                >
                    <img
                        :src="preview"
                        alt=""
                        draggable="false"
                        :style="frameStyle"
                    />
                </div>
                <div class="artwork-editor__result">
                    <span class="artwork-editor__result-label">В расписании</span>
                    <div
                        class="artwork-editor__icon"
                        aria-hidden="true"
                    >
                        <img
                            :src="preview"
                            alt=""
                            draggable="false"
                            :style="frameStyle"
                        />
                    </div>
                </div>
            </div>
            <label class="artwork-editor__slider">
                <span>Приближение {{ placement.zoom.toFixed(1) }}×</span>
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    :value="placement.zoom"
                    @input="commit({ zoom: $event.target.value })"
                />
            </label>
            <label class="artwork-editor__slider">
                <span>Растяжение {{ placement.stretch.toFixed(2) }}×</span>
                <input
                    type="range"
                    min="0.75"
                    max="1.6"
                    step="0.01"
                    :value="placement.stretch"
                    @input="commit({ stretch: $event.target.value })"
                />
            </label>
            <BaseButton
                variant="ghost"
                size="sm"
                :disabled="uploading"
                @click="commit({ zoom: 1, stretch: 1, x: 0, y: 0 })"
                >Сбросить кадр</BaseButton
            >
            <BaseButton
                variant="ghost"
                size="sm"
                :disabled="uploading"
                @click="emit('update:modelValue', null)"
                >Вернуть стандартную картинку</BaseButton
            >
            <p class="artwork-editor__hint">
                Потяните картинку внутри квадрата. Иконка у участников обновится после сохранения
                расписания.
            </p>
        </template>
    </div>
</template>

<style lang="scss">
    .artwork-editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--color-line);
        min-width: 0;
    }

    .artwork-editor__hint {
        font-size: 12px;
        color: var(--color-ink-muted);
    }

    .artwork-editor input[type='file'] {
        width: 100%;
        min-height: 44px;
        font: inherit;
        font-size: 12px;
    }

    .artwork-editor input::file-selector-button {
        border: 0;
        border-radius: 10px;
        padding: 12px;
        margin-right: 8px;
        background: var(--color-sage-soft);
        color: var(--color-sage-deep);
        font: inherit;
        cursor: pointer;
    }

    .artwork-editor__stage {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .artwork-editor__frame,
    .artwork-editor__icon {
        overflow: hidden;
        border-radius: 12px;
        background: var(--color-surface-muted);
        border: var(--border-hairline) solid var(--color-line);

        img {
            display: block;
            width: 100%;
            height: 100%;
            pointer-events: none;
            user-select: none;
        }
    }

    .artwork-editor__frame {
        width: 168px;
        height: 168px;
        flex-shrink: 0;
        touch-action: none;
        cursor: grab;
    }

    .artwork-editor__frame:active {
        cursor: grabbing;
    }

    .artwork-editor__result {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .artwork-editor__result-label {
        font-size: 12px;
        color: var(--color-ink-muted);
    }

    .artwork-editor__icon {
        width: 64px;
        height: 64px;
    }

    .artwork-editor__slider {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--color-ink-muted);
    }

    .artwork-editor__slider input {
        width: 100%;
        accent-color: var(--color-sage-deep);
    }
</style>
