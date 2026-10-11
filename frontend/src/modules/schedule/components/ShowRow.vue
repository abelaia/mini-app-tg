<script setup>
import { computed } from 'vue'
import ReminderBell from '@/modules/reminders/components/ReminderBell.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'
import ShowArt from './ShowArt.vue'

const props = defineProps({
  show: { type: Object, required: true },
  caption: { type: String, default: '' },
})

const schedule = useScheduleStore()
const platform = computed(() => schedule.platformOf(props.show))
</script>

<template>
  <article class="show-row">
    <ShowArt :show="show" size="medallion" />
    <div class="show-row__body">
      <span v-if="caption" class="show-row__caption">{{ caption }}</span>
      <h3 class="show-row__title">{{ show.title }}</h3>
      <p class="show-row__meta">{{ show.translator }} · {{ platform.title }}</p>
      <div class="show-row__times">
        <ReminderBell v-for="kind in content.kindOrder" :key="kind" :show-id="show.id" :kind="kind" variant="chip" :label="show.times[kind]" :hint="content.kinds[kind].hint" />
      </div>
    </div>
  </article>
</template>

<style lang="scss">
.show-row {
  display: flex;
  gap: var(--space-3);

  &__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__caption {
    @include eyebrow;
    font-size: var(--fs-xxs);
    color: var(--color-sage);
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-lg);
    font-weight: 600;
    line-height: 1.15;
  }

  &__meta {
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &__times {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
}
</style>
