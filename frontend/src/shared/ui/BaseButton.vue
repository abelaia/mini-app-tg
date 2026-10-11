<script setup>
import { mod } from '@/shared/lib/text'
import BaseIcon from './BaseIcon.vue'

defineProps({
  icon: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
})
</script>

<template>
  <button type="button" :class="mod('button', { [variant]: true, [size]: true, block })">
    <BaseIcon v-if="icon" class="button__icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <span class="button__label"><slot /></span>
  </button>
</template>

<style lang="scss">
.button {
  @include button-reset;
  @include press;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-pill);
  font-weight: 600;
  white-space: nowrap;

  &--md {
    min-height: 46px;
    padding: 0 var(--space-5);
    font-size: var(--fs-sm);
  }

  &--sm {
    min-height: 34px;
    padding: 0 var(--space-4);
    font-size: var(--fs-xs);
  }

  &--block {
    display: flex;
    width: 100%;
  }

  &--primary {
    background: var(--color-sage-deep);
    color: var(--color-on-accent);
  }

  &--ghost {
    background: transparent;
    color: var(--color-ink-soft);
    box-shadow: inset 0 0 0 var(--border-hairline) var(--color-line);
  }

  &--danger {
    background: var(--color-rose-soft);
    color: var(--color-rose);
  }
}
</style>
