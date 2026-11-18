<script setup>
import app from '@/shared/content/app.json'
import { useNow } from '@/shared/composables/useNow'
import { brandAvatar } from '@/shared/lib/media'

const { zoned } = useNow()
</script>

<template>
  <header class="header">
    <img class="header__logo" :src="brandAvatar" width="44" height="44" alt="" decoding="async" />
    <div class="header__brand">
      <span class="header__title">{{ app.brand.title }}</span>
      <span class="header__script">{{ app.brand.script }}</span>
    </div>
    <div class="header__clock">
      <span class="header__time">{{ zoned.clock }}</span>
      <span class="header__zone">{{ app.clock.zone }}</span>
    </div>
  </header>
</template>

<style lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--header-height);
  padding: calc(var(--safe-top) + var(--space-3)) var(--gutter) var(--space-2);

  &__logo {
    flex-shrink: 0;
    border-radius: var(--radius-pill);
    box-shadow: 0 8px 20px -12px var(--color-shadow);
    object-fit: cover;
  }

  &__brand {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }

  &__script {
    margin: -2px 0 0 58px;
    font-family: var(--font-script);
    font-size: var(--fs-xl);
    line-height: 1;
    color: var(--color-rose);
    transform: rotate(-4deg);
    transform-origin: left center;
  }

  &__clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    border: var(--border-hairline) solid var(--color-line);
  }

  &__time {
    font-family: var(--font-sans);
    font-size: var(--fs-lg);
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__zone {
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--color-ink-soft);
  }
}
</style>
