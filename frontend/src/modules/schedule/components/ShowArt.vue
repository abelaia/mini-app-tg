<script setup>
    import { artworkTransform } from '@/shared/lib/artworkFrame'
    import { showPoster, showPosterSprite } from '@/shared/lib/media'
    import { mod } from '@/shared/lib/text'
    import { computed, useId } from 'vue'

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
    const sprite = computed(() =>
        props.show.artwork?.url ? null : showPosterSprite(props.show.id),
    )
    const clipId = useId()
</script>

<template>
    <figure
        :class="[
            mod('art', { [size]: true }),
            { 'art--custom': show.artwork, 'art--sprite': sprite },
        ]"
    >
        <svg
            v-if="sprite"
            class="art__image art__image--sprite"
            :viewBox="sprite.viewBox"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
        >
            <defs>
                <clipPath :id="clipId"><rect v-bind="sprite.clip" /></clipPath>
            </defs>
            <image
                :href="sprite.src"
                width="1254"
                height="1254"
                :clip-path="`url(#${clipId})`"
            />
        </svg>
        <img
            v-else
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
        background: var(--color-surface-muted);

        &--photo {
            aspect-ratio: 16 / 12;
            border-radius: var(--radius-md);
            background: radial-gradient(
                120% 90% at 50% 30%,
                var(--color-surface) 0%,
                var(--color-surface-muted) 70%
            );
        }

        &--medallion {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
            border-radius: 50%;
            border: var(--border-hairline) solid var(--color-line);
            box-shadow: 0 8px 18px -12px var(--color-shadow);
            background: var(--color-surface);
        }

        &--custom.art--medallion,
        &--sprite.art--medallion {
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

        &__image--sprite {
            overflow: hidden;
        }
    }
</style>
