<script setup>
    import { computed } from 'vue'
    import { rasterIcons } from '@/shared/lib/media'
    import { mod } from '@/shared/lib/text'

    const props = defineProps({
        name: { type: String, required: true },
        size: { type: [Number, String], default: 72 },
        tone: { type: String, default: 'plain' },
    })

    const src = computed(() => rasterIcons[props.name] ?? '')
</script>

<template>
    <span
        v-if="src"
        :class="mod('mark', { [tone]: true })"
        :style="{ '--mark-size': `${size}px` }"
    >
        <img
            class="mark__image"
            :src="src"
            alt=""
            decoding="async"
        />
    </span>
</template>

<style lang="scss">
    .mark {
        display: inline-grid;
        place-items: center;
        width: var(--mark-size);
        height: var(--mark-size);
        flex-shrink: 0;

        &--soft {
            border-radius: 50%;
            background: var(--color-surface-muted);
        }

        &--rose {
            border-radius: 50%;
            background: var(--color-rose-soft);
        }

        &--sage {
            border-radius: 50%;
            background: var(--color-sage-soft);
        }

        &__image {
            display: block;
            width: 86%;
            height: 86%;
            object-fit: contain;
            filter: drop-shadow(0 10px 18px rgba(42, 33, 28, 0.18));
        }
    }
</style>
