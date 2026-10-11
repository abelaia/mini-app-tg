<script setup>
import { useToast } from '@/shared/composables/useToast'
import { mod } from '@/shared/lib/text'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" :class="mod('toast', { [toast.tone]: true })" @click="dismiss(toast.id)">
        {{ toast.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss">
.toasts {
  position: fixed;
  left: var(--gutter);
  right: var(--gutter);
  bottom: calc(var(--safe-bottom) + var(--tabbar-height) + var(--space-6));
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  max-width: 100%;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  background: var(--color-ink);
  color: var(--color-bg);
  font-size: var(--fs-sm);
  font-weight: 600;
  text-align: center;
  box-shadow: 0 14px 30px -12px var(--color-shadow);
  pointer-events: auto;

  &--success {
    background: var(--color-sage-deep);
    color: var(--color-on-accent);
  }

  &--error {
    background: var(--color-rose);
    color: var(--color-cream);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-spring);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
</style>
