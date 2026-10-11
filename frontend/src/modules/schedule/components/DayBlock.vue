<script setup>
import { mod } from '@/shared/lib/text'
import content from '../content.json'
import ShowRow from './ShowRow.vue'

defineProps({
  day: { type: String, required: true },
  shows: { type: Array, required: true },
  today: { type: Boolean, default: false },
})
</script>

<template>
  <section :class="mod('day', { today, empty: !shows.length })">
    <header class="day__head">
      <span class="day__short">{{ content.days[day].short }}</span>
      <h3 class="day__name">{{ content.days[day].full }}</h3>
      <span v-if="today" class="day__badge">{{ content.week.today }}</span>
      <span v-if="!shows.length" class="day__empty">{{ content.week.empty }}</span>
    </header>
    <div v-if="shows.length" class="day__shows">
      <ShowRow v-for="show in shows" :key="show.id" :show="show" />
    </div>
  </section>
</template>

<style lang="scss">
.day {
  @include card;
  padding: var(--space-4);

  &--today {
    border-color: var(--color-sage);
    box-shadow: 0 0 0 var(--border-hairline) var(--color-sage), 0 18px 40px -28px var(--color-shadow);
  }

  &--empty {
    padding-block: var(--space-3);
    background: transparent;
    box-shadow: none;
    border-style: dashed;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__short {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    background: var(--color-sage-soft);
    color: var(--color-sage-deep);
    font-size: var(--fs-xxs);
    font-weight: 700;
    text-transform: uppercase;
  }

  &--today &__short {
    background: var(--color-sage-deep);
    color: var(--color-on-accent);
  }

  &--empty &__short {
    background: transparent;
    color: var(--color-ink-muted);
  }

  &__name {
    flex: 1;
    font-family: var(--font-serif);
    font-size: var(--fs-lg);
    font-weight: 600;
  }

  &--empty &__name {
    color: var(--color-ink-muted);
  }

  &__badge {
    @include eyebrow;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    background: var(--color-rose-soft);
    color: var(--color-rose);
    font-size: var(--fs-xxs);
  }

  &__empty {
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &__shows {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: var(--border-hairline) solid var(--color-line);
  }
}
</style>
