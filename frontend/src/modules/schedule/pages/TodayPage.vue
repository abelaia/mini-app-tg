<script setup>
import { computed } from 'vue'
import AsyncState from '@/shared/ui/AsyncState.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SectionHeading from '@/shared/ui/SectionHeading.vue'
import { useNow } from '@/shared/composables/useNow'
import { fill } from '@/shared/lib/text'
import { shiftDay } from '@/shared/lib/time'
import ShowPolaroid from '../components/ShowPolaroid.vue'
import ShowRow from '../components/ShowRow.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'

const UPCOMING_LIMIT = 3

const schedule = useScheduleStore()
const { zoned, dateLabel } = useNow()

const todayShows = computed(() => schedule.byDay[zoned.value.day] ?? [])

const upcoming = computed(() =>
  [1, 2, 3, 4, 5, 6]
    .flatMap((offset) => {
      const day = shiftDay(zoned.value.day, offset)
      const caption = offset === 1 ? content.tomorrow : content.days[day].full
      return (schedule.byDay[day] ?? []).map((show) => ({ show, caption, day }))
    })
    .slice(0, UPCOMING_LIMIT),
)

const emptyText = computed(() => {
  const next = upcoming.value[0]
  if (!next) return ''
  return fill(content.today.empty.text, { day: next.caption.toLowerCase(), title: next.show.title, time: next.show.times.premiere })
})

const eyebrow = computed(() => `${content.days[zoned.value.day].full}, ${dateLabel.value}`)
</script>

<template>
  <section class="today">
    <SectionHeading :eyebrow="eyebrow" :title="content.today.title" />
    <AsyncState :status="schedule.status" @retry="schedule.load">
      <div v-if="todayShows.length" :class="['today__stack', { 'today__stack--carousel': todayShows.length > 1 }]">
        <ShowPolaroid v-for="(show, i) in todayShows" :key="show.id" class="today__card" :show="show" :now-minutes="zoned.minutes" :tilt="i % 2 ? 1.2 : -1.2" :style="{ animationDelay: `${i * 90}ms` }" />
      </div>
      <EmptyState v-else icon="rose" :title="content.today.empty.title" :text="emptyText" />
      <div v-if="upcoming.length" class="today__upcoming">
        <SectionHeading :title="content.today.upcoming">
          <RouterLink to="/week">
            <BaseButton variant="ghost" size="sm" icon="calendar">{{ content.today.allWeek }}</BaseButton>
          </RouterLink>
        </SectionHeading>
        <div class="today__list">
          <ShowRow v-for="item in upcoming" :key="item.show.id" :show="item.show" :caption="item.caption" />
        </div>
      </div>
    </AsyncState>
  </section>
</template>

<style lang="scss">
.today {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);

  &__stack {
    display: flex;
    flex-direction: column;
    padding-top: var(--space-3);

    &--carousel {
      @include no-scrollbar;
      flex-direction: row;
      gap: var(--space-4);
      margin: 0 calc(var(--gutter) * -1);
      padding: var(--space-4) var(--gutter) var(--space-6);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: var(--gutter);

      .today__card {
        flex: 0 0 86%;
        scroll-snap-align: start;
      }
    }
  }

  &__upcoming {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    .heading__title {
      font-size: var(--fs-xl);
    }
  }

  &__list {
    @include card;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-4);
  }
}
</style>
