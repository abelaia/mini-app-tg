<script setup>
import app from '@/shared/content/app.json'
import BaseButton from './BaseButton.vue'
import EmptyState from './EmptyState.vue'

defineProps({
  status: { type: String, required: true },
  skeletons: { type: Number, default: 3 },
})

defineEmits(['retry'])
</script>

<template>
  <slot v-if="status === 'ready'" />
  <EmptyState v-else-if="status === 'error'" icon="close" :title="app.state.error.title" :text="app.state.error.text">
    <BaseButton icon="repeat" @click="$emit('retry')">{{ app.state.error.action }}</BaseButton>
  </EmptyState>
  <div v-else class="skeleton">
    <span v-for="n in skeletons" :key="n" class="skeleton__item" />
  </div>
</template>

<style lang="scss">
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__item {
    height: 96px;
    border-radius: var(--radius-lg);
    background: linear-gradient(100deg, var(--color-surface-muted) 30%, var(--color-surface) 50%, var(--color-surface-muted) 70%);
    background-size: 300% 100%;
    animation: skeleton-shimmer 1.4s linear infinite;

    &:first-child {
      height: 320px;
    }
  }
}

@keyframes skeleton-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: 0 0;
  }
}
</style>
