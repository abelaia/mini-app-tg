<script setup>
import { computed } from 'vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import { mod } from '@/shared/lib/text'
import content from '../content.json'
import { useReminderActions } from '../composables/useReminderActions'
import { useRemindersStore } from '../store'

const props = defineProps({
  showId: { type: String, required: true },
  kind: { type: String, required: true },
  variant: { type: String, default: 'pill' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const reminders = useRemindersStore()
const { toggle } = useReminderActions()

const active = computed(() => reminders.isOn(props.showId, props.kind))
const busy = computed(() => reminders.isPending(props.showId, props.kind))
const text = computed(() => props.label || (active.value ? content.bell.on : content.bell.off))
</script>

<template>
  <button type="button" :class="mod('bell', { [variant]: true, active, busy })" :aria-pressed="active" @click.stop="toggle(showId, kind)">
    <BaseIcon class="bell__icon" name="bell" :size="variant === 'chip' ? 14 : 16" :stroke="active ? 2 : 1.6" />
    <span class="bell__label">{{ text }}</span>
    <span v-if="hint" class="bell__hint">{{ hint }}</span>
  </button>
</template>

<style lang="scss">
.bell {
  @include button-reset;
  @include press(0.93);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  &--pill {
    height: 34px;
    padding: 0 var(--space-3) 0 10px;
    font-size: var(--fs-xs);
    background: transparent;
    color: var(--color-paper-ink);
    box-shadow: inset 0 0 0 var(--border-hairline) var(--color-paper-line);
  }

  &--chip {
    height: 30px;
    padding: 0 10px 0 8px;
    font-size: var(--fs-xs);
    background: var(--color-surface-muted);
    color: var(--color-ink-soft);
  }

  &--active {
    background: var(--color-rose);
    color: var(--color-cream);
    box-shadow: 0 6px 16px -8px var(--color-rose);

    .bell__icon {
      animation: bell-ring 0.7s var(--ease-out);
    }
  }

  &--busy {
    opacity: 0.6;
    pointer-events: none;
  }

  &__icon {
    transform-origin: 50% 15%;
  }

  &__hint {
    font-weight: 500;
    opacity: 0.7;

    &::before {
      content: '·';
      margin-right: 6px;
    }
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0);
  }

  20% {
    transform: rotate(18deg);
  }

  40% {
    transform: rotate(-14deg);
  }

  60% {
    transform: rotate(8deg);
  }

  80% {
    transform: rotate(-4deg);
  }
}
</style>
