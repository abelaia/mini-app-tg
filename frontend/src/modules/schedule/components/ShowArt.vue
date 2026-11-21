<script setup>
    import { artworkTransform } from '@/shared/lib/artworkFrame'
    import { showPoster } from '@/shared/lib/media'
    import { mod } from '@/shared/lib/text'
    import { computed } from 'vue'

    const props = defineProps({
        show: { type: Object, required: true },
        size: { type: String, default: 'photo' },
    })
    const source = computed(() =>
        props.show.artwork?.url
            ? `${import.meta.env.VITE_API_URL ?? ''}${props.show.artwork.url}`
            : showPoster(props.show.id),
    )
    const frame = computed(() =>
        props.show.artwork?.url ? artworkTransform(props.show.artwork) : undefined,
    )
</script>

<template>
    <figure :class="[mod('art', { [size]: true }), { 'art--custom': show.artwork }]">
        <img
            class="art__image"
            :src="source"
            :style="frame"
            alt=""
            loading="lazy"
            decoding="async"
        />
        <slot />
    </figure>
</template>

<style lang="scss">
    .art {
        position: relative;
        margin: 0;
        overflow: hidden;
        background: transparent;

        &--photo {
            aspect-ratio: 16 / 12;
            border-radius: var(--radius-md);
        }

        &--medallion {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
            border-radius: 0;
        }

        &--custom.art--medallion {
            border-radius: 12px;
            box-shadow: none;
        }

        &__image {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 4%;
        }
    }
</style>
