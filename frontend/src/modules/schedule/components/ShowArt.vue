<script setup>
import { showPoster } from '@/shared/lib/media'
import { mod } from '@/shared/lib/text'

const props = defineProps({
  show: { type: Object, required: true },
  size: { type: String, default: 'photo' },
})
</script>

<template>
  <figure :class="mod('art', { [size]: true })">
    <img class="art__image" :src="showPoster(show.id)" alt="" loading="lazy" decoding="async" />
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
    aspect-ratio: 16 / 11;
    border-radius: var(--radius-md);
    box-shadow: inset 0 0 0 var(--border-hairline) var(--color-line);
  }

  &--medallion {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: 50%;
    border: var(--border-hairline) solid var(--color-line);
    box-shadow: 0 8px 18px -12px var(--color-shadow);
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>