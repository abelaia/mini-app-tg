<script setup>
import { computed } from 'vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import ReminderBell from '@/modules/reminders/components/ReminderBell.vue'
import { mod } from '@/shared/lib/text'
import content from '../content.json'
import { eventStatus } from '../lib/eventStatus'

const props = defineProps({
  show: { type: Object, required: true },
  kind: { type: String, required: true },
  nowMinutes: { type: Number, default: null },
})

const clock = computed(() => props.show.times[props.kind])
const meta = computed(() => content.kinds[props.kind])
const status = computed(() => (props.nowMinutes === null ? null : eventStatus(clock.value, props.nowMinutes)))
</script>

<template>
  <li :class="mod('event', { [status?.state]: Boolean(status) })">
    <span class="event__time">{{ clock }}</span>
    <div class="event__body">
      <span class="event__title">
        <BaseIcon :name="meta.icon" :size="14" />
        {{ meta.short }}
      </span>
      <span v-if="status" class="event__status">{{ status.label }}</span>
    </div>
    <ReminderBell :show-id="show.id" :kind="kind" />
  </li>
</template>

<style lang="scss">
.event {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  color: var(--color-paper-ink);

  & + & {
    border-top: var(--border-hairline) dashed var(--color-paper-line);
  }

  &__time {
    font-family: var(--font-serif);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
  }

  &__status {
    font-size: var(--fs-xs);
    color: var(--color-paper-muted);
  }

  &--live &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-photo-rose-b);
    font-weight: 700;

    &::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      animation: live-pulse 1.6s ease-in-out infinite;
    }
  }

  &--done &__time,
  &--done &__body {
    opacity: 0.45;
  }
}

@keyframes live-pulse {
  50% {
    opacity: 0.3;
    transform: scale(0.7);
  }
}
</style>
