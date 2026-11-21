<script setup>
    import { computed } from 'vue'
    import AsyncState from '@/shared/ui/AsyncState.vue'
    import SectionHeading from '@/shared/ui/SectionHeading.vue'
    import { useNow } from '@/shared/composables/useNow'
    import { fill } from '@/shared/lib/text'
    import { shiftDay } from '@/shared/lib/time'
    import PromoBanner from '../components/PromoBanner.vue'
    import ScheduleCard from '../components/ScheduleCard.vue'
    import CommunityBanner from '../components/CommunityBanner.vue'
    import BaseIcon from '@/shared/ui/BaseIcon.vue'
    import ShowRow from '../components/ShowRow.vue'
    import content from '../content.json'
    import { broadcastDuration, broadcastTiming } from '../lib/broadcastTiming'
    import { useScheduleStore } from '../store'

    const UPCOMING_LIMIT = 3

    const schedule = useScheduleStore()
    const { zoned, dateLabel } = useNow()

    const todayShows = computed(() => {
        const previous = schedule.byDay[shiftDay(zoned.value.day, -1)] ?? []
        const continuing = previous.filter((show) =>
            content.kindOrder.some(
                (kind) =>
                    show.times?.[kind] &&
                    broadcastTiming(
                        show.times[kind],
                        zoned.value.minutes + 1440,
                        show.endTimes?.[kind],
                        broadcastDuration(kind),
                    ).state === 'live',
            ),
        )
        return [...continuing, ...(schedule.byDay[zoned.value.day] ?? [])]
    })

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
        return fill(content.today.empty.text, {
            day: next.caption.toLowerCase(),
            title: next.show.title,
            time: next.show.times.premiere,
        })
    })

    const eyebrow = computed(() => `${content.days[zoned.value.day].full}, ${dateLabel.value}`)
</script>

<template>
    <section class="today">
        <CommunityBanner />
        <header class="today__heading">
            <h1>{{ content.today.title }}</h1>
            <div class="today__date">
                <p>{{ eyebrow }}</p>
                <span v-if="todayShows.length">{{ todayShows.length }} в расписании</span>
            </div>
        </header>
        <AsyncState
            :status="schedule.status"
            @retry="schedule.load"
        >
            <div
                v-if="todayShows.length"
                class="today__stack"
            >
                <div
                    v-for="(show, i) in todayShows"
                    :key="show.id"
                    class="today__show"
                >
                    <p
                        v-if="show.day !== zoned.day"
                        class="today__carryover"
                    >
                        Эфир начался вчера
                    </p>
                    <ScheduleCard
                        :show="show"
                        :featured="i === 0"
                        :now-minutes="zoned.minutes + (show.day === zoned.day ? 0 : 1440)"
                    />
                </div>
            </div>
            <div
                v-else
                class="today__empty"
            >
                <BaseIcon
                    name="calendar"
                    :size="30"
                />
                <h2>{{ content.today.empty.title }}</h2>
                <p>{{ emptyText }}</p>
            </div>
            <PromoBanner />
            <div
                v-if="upcoming.length"
                class="today__upcoming"
            >
                <SectionHeading :title="content.today.upcoming">
                    <RouterLink
                        to="/week"
                        class="today__week-link"
                        >{{ content.today.allWeek }}
                        <BaseIcon
                            name="arrow-right"
                            :size="18"
                    /></RouterLink>
                </SectionHeading>
                <div class="today__list">
                    <ShowRow
                        v-for="item in upcoming"
                        :key="item.show.id"
                        :show="item.show"
                        :caption="item.caption"
                    />
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
            gap: 24px;

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

<style lang="scss">
    .today {
        gap: 28px;

        &__heading h1 {
            font: 600 clamp(32px, 8.8vw, 40px)/1.05 var(--font-serif);
            color: var(--color-ink);
        }

        &__date {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 16px;
            color: var(--color-ink-muted);
            font-size: 12px;
        }

        &__date span {
            color: var(--color-sage-deep);
            font-weight: 600;
            white-space: nowrap;
        }

        &__week-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 44px;
            color: var(--color-sage-deep);
            font-size: 12px;
            white-space: nowrap;
        }

        &__list {
            padding: 0;
            background: none;
            box-shadow: none;
            border: 0;
            border-radius: 0;
            gap: 24px;
        }

        &__carryover {
            margin-bottom: 10px;
            font-size: 12px;
            color: var(--color-ink-muted);
        }

        &__empty {
            padding: 30px 20px;
            border-radius: 16px;
            background: var(--color-surface);
            text-align: center;
            color: var(--color-sage-deep);
        }

        &__empty h2 {
            margin-top: 16px;
            font: 600 28px/1.1 var(--font-serif);
            color: var(--color-ink);
        }

        &__empty p {
            margin-top: 12px;
            font-size: 13px;
            color: var(--color-ink-muted);
        }

        &__upcoming .heading {
            align-items: center;
        }
    }
</style>
