<script setup>
    import { computed } from 'vue'
    import ShowArt from './ShowArt.vue'
    import EventRow from './EventRow.vue'
    import content from '../content.json'
    import { useScheduleStore } from '../store'

    const props = defineProps({
        show: { type: Object, required: true },
        featured: { type: Boolean, default: false },
        nowMinutes: { type: Number, default: null },
    })
    const schedule = useScheduleStore()
    const platform = computed(() => schedule.platformOf(props.show))
    const kinds = computed(() => content.kindOrder.filter((kind) => props.show.times?.[kind]))
</script>

<template>
    <article :class="['schedule-card', { 'schedule-card--featured': featured }]">
        <div
            v-if="featured"
            class="schedule-card__cover"
        >
            <div class="schedule-card__cover-copy">
                <span class="schedule-card__platform">{{ platform.title }}</span>
                <p>
                    Перевод<span>{{ show.translator }}</span>
                </p>
            </div>
            <ShowArt
                class="schedule-card__cover-art"
                :show="{ ...show, artwork: null }"
            />
            <span
                class="schedule-card__signature"
                aria-hidden="true"
                >TürkDiziOnline</span
            >
        </div>
        <div class="schedule-card__content">
            <header class="schedule-card__heading">
                <div class="schedule-card__identity">
                    <h3 class="schedule-card__title">{{ show.title }}</h3>
                    <p class="schedule-card__meta">{{ show.translator }} · {{ platform.title }}</p>
                </div>
                <ShowArt
                    v-if="show.artwork || !featured"
                    class="schedule-card__icon"
                    :show="show"
                    size="medallion"
                />
            </header>
            <ul class="schedule-card__events">
                <EventRow
                    v-for="kind in kinds"
                    :key="kind"
                    :show="show"
                    :kind="kind"
                    :now-minutes="nowMinutes"
                />
            </ul>
        </div>
    </article>
</template>

<style lang="scss">
    .schedule-card {
        min-width: 0;
        overflow: hidden;
        border-radius: 16px;
        background: var(--color-card-paper);

        &__heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding-bottom: 18px;
            border-bottom: 1px solid var(--color-line);
        }

        &__identity {
            min-width: 0;
        }

        &__cover {
            position: relative;
            isolation: isolate;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
            align-items: center;
            min-height: 218px;
            overflow: hidden;
            background-color: #3d4f36;
            background-image:
                linear-gradient(105deg, rgba(36, 52, 40, 0.97), rgba(67, 83, 52, 0.83)),
                url('/assets/backgrounds/today.webp');
            background-position:
                center,
                center bottom;
            background-size: cover;
            color: #fff4df;
            padding: 24px 14px 36px 26px;
            border-radius: 16px;

            &::before {
                position: absolute;
                z-index: -1;
                inset: 10px;
                border: 1px solid rgba(235, 217, 174, 0.3);
                border-radius: 9px;
                content: '';
                pointer-events: none;
            }

            .art {
                aspect-ratio: 1.15;
                border-radius: 0;
            }

            .art__image {
                padding: 0;
            }
        }

        &__platform {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 5px 10px;
            border: 1px solid rgba(235, 217, 174, 0.4);
            border-radius: 6px;
            color: #f2e4c7;
            font-size: 11px;
            font-weight: 600;

            &::before {
                width: 4px;
                height: 4px;
                flex-shrink: 0;
                border-radius: 50%;
                background: currentColor;
                content: '';
            }
        }

        &__cover-copy {
            position: relative;
            z-index: 1;
            align-self: start;
            padding-top: 5px;

            p {
                margin-top: 20px;
                font: 500 clamp(24px, 6.4vw, 32px)/1.08 var(--font-serif);
                overflow-wrap: anywhere;
            }

            p span {
                display: block;
                margin-top: 2px;
                color: #ead6a7;
                font-size: 1.25em;
                font-style: italic;
            }
        }

        &__cover-art {
            position: relative;
            z-index: 1;
            align-self: center;
            transform: translate(3px, 5px) scale(1.05);
            filter: drop-shadow(0 12px 10px rgba(12, 23, 15, 0.3));
        }

        &__signature {
            position: absolute;
            right: 24px;
            bottom: 17px;
            left: 26px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #ddcfaf;
            font-family: var(--font-serif);
            font-size: 12px;
            letter-spacing: 0.06em;

            &::after {
                height: 1px;
                flex: 1;
                background: rgba(235, 217, 174, 0.3);
                content: '';
            }
        }

        &__icon {
            width: 86px;
            height: 86px;
            flex-shrink: 0;
            border-radius: 12px;
        }

        &__content {
            padding: 22px 20px 12px;
            background-image:
                linear-gradient(
                    color-mix(in srgb, var(--color-card-paper) 94%, transparent),
                    color-mix(in srgb, var(--color-card-paper) 94%, transparent)
                ),
                url('/assets/backgrounds/today.webp');
            background-position:
                center,
                left bottom;
            background-size: cover;
        }

        &__title {
            font: 600 30px/1.08 var(--font-serif);
            color: var(--color-ink);
            overflow-wrap: anywhere;
        }

        &__meta {
            margin-top: 8px;
            color: var(--color-ink-muted);
            font-size: 12px;
        }

        &__events {
            margin-top: 6px;
        }

        &--featured {
            background: var(--color-card-paper);
            border-radius: 16px;
        }

        &--featured &__content {
            padding: 22px 20px 12px;
        }
    }
</style>
