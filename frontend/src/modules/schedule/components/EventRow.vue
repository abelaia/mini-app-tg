<script setup>
import { computed } from 'vue'
import ReminderBell from '@/modules/reminders/components/ReminderBell.vue'
import { mod } from '@/shared/lib/text'
import content from '../content.json'
import { eventStatus } from '../lib/eventStatus'

const props = defineProps({
  show: { type: Object, required: true },
  kind: { type: String, required: true },
  nowMinutes: { type: Number, default: null },
  quiet: { type: Boolean, default: false },
})

const clock = computed(() => props.show.times[props.kind])
const meta = computed(() => content.kinds[props.kind])
const status = computed(() => (props.nowMinutes === null ? null : eventStatus(clock.value, props.nowMinutes, props.kind)))
</script>

<template>
  <li :class="mod('event', { [status?.state]: Boolean(status), quiet })">
    <span class="event__time">{{ clock }}</span>
    <div class="event__body">
      <span class="event__title">{{ meta.short }}</span>
      <span v-if="status" class="event__status">{{ status.label }}</span>
    </div>
    <ReminderBell :show-id="show.id" :kind="kind" :variant="quiet ? 'quiet' : 'pill'" />
  </li>
</template>

<style lang="scss">
.event {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  color: var(--color-ink);

  & + & {
    border-top: var(--border-hairline) dashed var(--color-line);
  }

  &__time {
    font-family: var(--font-sans);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &--quiet &__time {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--color-ink-soft);
  }

  &--quiet &__title,
  &--quiet &__status {
    color: var(--color-ink-muted);
    font-weight: 500;
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
    gap: var(--space-2);
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
  }

  &__status {
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &--live &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-rose);
    font-weight: 600;

    &::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
  }

  &--done &__time,
  &--done &__body {
    opacity: 0.45;
  }
}

</style>
