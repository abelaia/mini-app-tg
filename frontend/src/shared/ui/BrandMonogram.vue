<script setup>
import app from '@/shared/content/app.json'

defineProps({
  size: { type: Number, default: 44 },
})
</script>

<template>
  <svg class="monogram" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <circle class="monogram__disc" cx="32" cy="32" r="31" />
    <circle class="monogram__ring" cx="32" cy="32" r="27" />
    <text class="monogram__letters" x="32" y="39" text-anchor="middle">{{ app.brand.monogram }}</text>
    <path class="monogram__rose" d="M32 50.5c-1.6 0-2.7-1.1-2.7-2.7 1.1 0 1.7.4 2 .9.1-1.6.4-2.5.7-3.2.3.7.6 1.6.7 3.2.3-.5.9-.9 2-.9 0 1.6-1.1 2.7-2.7 2.7z" />
  </svg>
</template>

<style lang="scss">
.monogram {
  flex-shrink: 0;
  filter: drop-shadow(0 6px 14px var(--color-shadow));

  &__disc {
    fill: var(--color-photo-sage-b);
  }

  &__ring {
    fill: none;
    stroke: var(--color-gold);
    stroke-width: 1;
  }

  &__letters {
    fill: var(--color-cream);
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 600;
    font-size: 24px;
    letter-spacing: -0.02em;
  }

  &__rose {
    fill: var(--color-rose-soft);
  }
}
</style>
