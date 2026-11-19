<script setup>
    import { computed, useId } from 'vue'
    const props = defineProps({
        label: { type: String, required: true },
        error: { type: String, default: '' },
        hint: { type: String, default: '' },
    })
    defineEmits(['blur'])
    const id = useId()
    const attrs = computed(() => ({
        id,
        'aria-invalid': props.error ? 'true' : undefined,
        'aria-describedby': props.error || props.hint ? `${id}-help` : undefined,
    }))
</script>

<template>
    <div
        class="field"
        @focusout="$emit('blur')"
    >
        <label
            class="field__label"
            :for="id"
            >{{ label }}</label
        >
        <slot :attrs="attrs" />
        <p
            v-if="error || hint"
            :id="`${id}-help`"
            :class="['field__help', { 'field__help--error': error }]"
            aria-live="polite"
        >
            {{ error || hint }}
        </p>
    </div>
</template>

<style lang="scss">
    .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;

        &__label {
            @include eyebrow;
            color: var(--color-ink-muted);
        }

        &__input {
            width: 100%;
            min-height: 44px;
            padding: 0 var(--space-3);
            border: var(--border-hairline) solid var(--color-line);
            border-radius: var(--radius-md);
            background: var(--color-surface-muted);
            color: var(--color-ink);
            font: inherit;

            &--area {
                min-height: 110px;
                padding: var(--space-3);
                resize: vertical;
            }
        }

        select#{&}__input {
            appearance: none;
            padding-right: 40px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%2371675b' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M4 6.2 8 10.2 12 6.2'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            background-size: 14px;
        }

        input[type='time']#{&}__input::-webkit-calendar-picker-indicator {
            margin-right: 10px;
        }
    }

    .field__help {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
        color: var(--color-ink-muted);
    }

    .field__help--error {
        color: var(--color-rose);
    }

    .field__input[aria-invalid='true'] {
        border-color: var(--color-rose);
    }

    :root[data-theme='dark'] select.field__input {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%239a9189' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M4 6.2 8 10.2 12 6.2'/%3E%3C/svg%3E");
    }
</style>
