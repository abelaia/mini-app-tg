<script setup>
    import BaseIcon from '@/shared/ui/BaseIcon.vue'
    import ShowArt from '@/modules/schedule/components/ShowArt.vue'
    import scheduleContent from '@/modules/schedule/content.json'
    import content from '../content.json'

    defineProps({
        show: { type: Object, required: true },
        kind: { type: String, required: true },
    })

    defineEmits(['remove'])
</script>

<template>
    <li class="reminder">
        <ShowArt
            :show="show"
            size="medallion"
        />
        <div class="reminder__body">
            <h3 class="reminder__title">{{ show.title }}</h3>
            <p class="reminder__meta">
                <BaseIcon
                    :name="scheduleContent.kinds[kind].icon"
                    :size="13"
                />
                {{ scheduleContent.days[show.day].short }} ·
                {{ scheduleContent.kinds[kind].title }}
            </p>
            <p class="reminder__timing">
                <time>{{ show.times[kind] }}</time>
                <span>МСК</span>
            </p>
        </div>
        <button
            type="button"
            class="reminder__remove"
            :aria-label="content.remove"
            @click="$emit('remove')"
        >
            <BaseIcon
                name="close"
                :size="18"
            />
        </button>
    </li>
</template>

<style lang="scss">
    .reminder {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) 0;

        & + & {
            border-top: var(--border-hairline) solid var(--color-line);
        }

        &__body {
            flex: 1;
            min-width: 0;
        }

        &__title {
            font-family: var(--font-serif);
            font-size: var(--fs-lg);
            font-weight: 600;
            line-height: 1.15;
        }

        &__meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 6px;
            font-size: var(--fs-xs);
            color: var(--color-ink-muted);
        }

        &__timing {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-top: 8px;
            color: var(--color-sage-deep);

            time {
                font: 600 25px/1 var(--font-serif);
                font-variant-numeric: tabular-nums;
            }

            span {
                font-size: 10px;
            }
        }

        &__remove {
            @include button-reset;
            @include press(0.88);
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            border-radius: 12px;
            background: var(--color-surface-muted);
            color: var(--color-ink-soft);
        }
    }
</style>
