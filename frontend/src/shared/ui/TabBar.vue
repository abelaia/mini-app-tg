<script setup>
import { haptic } from '@/shared/telegram/telegram'
import BaseIcon from './BaseIcon.vue'

defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <nav class="tabbar">
    <div class="tabbar__inner">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="tabbar__item" active-class="" exact-active-class="tabbar__item--active" @click="haptic.select()">
        <span class="tabbar__icon-wrap">
          <BaseIcon class="tabbar__icon" :name="item.icon" :size="22" />
          <span v-if="item.badge?.()" class="tabbar__badge">{{ item.badge() }}</span>
        </span>
        <span class="tabbar__label">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style lang="scss">
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-tabbar);
  padding: 0 var(--gutter) calc(var(--safe-bottom) + var(--space-3));
  pointer-events: none;

  &__inner {
    display: flex;
    gap: var(--space-1);
    max-width: 480px;
    margin: 0 auto;
    padding: var(--space-1);
    border-radius: var(--radius-xl);
    background: var(--color-surface-glass);
    border: var(--border-hairline) solid var(--color-line);
    box-shadow: 0 20px 40px -20px var(--color-shadow);
    backdrop-filter: blur(18px) saturate(1.2);
    pointer-events: auto;
  }

  &__item {
    @include press(0.94);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 56px;
    border-radius: var(--radius-lg);
    color: var(--color-ink-muted);
    -webkit-tap-highlight-color: transparent;

    &--active {
      background: var(--color-sage-deep);
      color: var(--color-on-accent);
    }
  }

  &__icon-wrap {
    position: relative;
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -9px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: var(--radius-pill);
    background: var(--color-rose);
    color: var(--color-cream);
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
  }

  &__label {
    font-size: var(--fs-xxs);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}
</style>
