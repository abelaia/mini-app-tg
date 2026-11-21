<script setup>
    import app from '@/shared/content/app.json'
    import { useNow } from '@/shared/composables/useNow'
    import { brandAvatar } from '@/shared/lib/media'
    import BaseIcon from './BaseIcon.vue'
    import { useTelegramTheme } from '@/shared/telegram/useTelegramTheme'
    import { haptic } from '@/shared/telegram/telegram'

    const { zoned } = useNow()
    const { theme, setTheme } = useTelegramTheme()

    function selectTheme(value) {
        const changed = theme.value !== value
        setTheme(value)
        if (changed) haptic.select()
    }
</script>

<template>
    <header class="header">
        <img
            class="header__logo"
            :src="brandAvatar"
            width="44"
            height="44"
            alt=""
            decoding="async"
        />
        <div class="header__brand">
            <span class="header__title">{{ app.brand.title }}</span>
            <span class="header__script">{{ app.brand.script }}</span>
        </div>
        <div class="header__controls">
            <div
                class="theme-switch"
                role="group"
                aria-label="Тема оформления"
            >
                <button
                    type="button"
                    aria-label="Светлая тема"
                    title="Светлая тема"
                    :aria-pressed="theme === 'light'"
                    @click="selectTheme('light')"
                >
                    <BaseIcon
                        name="sun"
                        :size="19"
                    />
                </button>
                <button
                    type="button"
                    aria-label="Тёмная тема"
                    title="Тёмная тема"
                    :aria-pressed="theme === 'dark'"
                    @click="selectTheme('dark')"
                >
                    <BaseIcon
                        name="moon"
                        :size="19"
                    />
                </button>
            </div>
            <div class="header__clock">
                <span class="header__time">{{ zoned.clock }}</span>
                <span class="header__zone">{{ app.clock.zone }}</span>
            </div>
        </div>
    </header>
</template>

<style lang="scss">
    .header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-height: var(--header-height);
        padding: calc(var(--safe-top) + var(--space-3)) var(--gutter) var(--space-2);

        &__logo {
            flex-shrink: 0;
            border-radius: var(--radius-pill);
            box-shadow: 0 8px 20px -12px var(--color-shadow);
            object-fit: cover;
        }

        &__brand {
            position: relative;
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
        }

        &__title {
            font-family: var(--font-serif);
            font-size: var(--fs-xl);
            font-weight: 600;
            line-height: 1;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--color-ink);
        }

        &__script {
            margin: -2px 0 0 58px;
            font-family: var(--font-script);
            font-size: var(--fs-xl);
            line-height: 1;
            color: var(--color-rose);
            transform: rotate(-4deg);
            transform-origin: left center;
        }

        &__clock {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius-md);
            background: var(--color-surface-glass);
            border: var(--border-hairline) solid var(--color-line);
            backdrop-filter: blur(12px);
        }

        &__time {
            font-family: var(--font-serif);
            font-size: var(--fs-lg);
            font-weight: 600;
            line-height: 1;
            font-variant-numeric: tabular-nums;
        }

        &__zone {
            @include eyebrow;
            font-size: var(--fs-xxs);
            color: var(--color-ink-muted);
        }
    }
</style>

<style lang="scss">
    .header__controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .theme-switch {
        display: flex;
        padding: 3px;
        border-radius: 14px;
        background: var(--color-surface);
        border: 1px solid var(--color-line);

        button {
            @include button-reset;
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            color: var(--color-ink-muted);
            transition:
                background-color var(--duration-fast),
                color var(--duration-fast);

            &[aria-pressed='true'] {
                background: var(--color-sage-soft);
                color: var(--color-sage-deep);
            }

            &:hover {
                color: var(--color-sage-deep);
            }
        }
    }

    @media (max-width: 379px) {
        .header__controls {
            flex-direction: column-reverse;
            align-items: flex-end;
            gap: 6px;
        }

        .header__clock {
            flex-direction: row;
            align-items: baseline;
            gap: 5px;
        }

        .header__title {
            font-size: 23px;
        }

        .header__script {
            margin-left: 42px;
        }
    }
</style>

<style lang="scss">
    .header {
        max-width: 520px;
        margin-inline: auto;
        padding-bottom: 20px;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: var(--gutter);
            right: var(--gutter);
            height: 1px;
            background: var(--color-line);
        }

        &__clock {
            padding-right: 0;
            background: none;
            border: 0;
            backdrop-filter: none;
        }

        &__time {
            font: 600 17px/1.2 var(--font-sans);
            color: var(--color-ink);
        }

        &__zone {
            font-size: 9px;
            letter-spacing: 0.04em;
        }

        &__logo {
            box-shadow: none;
            width: 38px;
            height: 38px;
            border-radius: 8px;
        }

        &__title {
            font-size: 25px;
            letter-spacing: 0.015em;
        }

        &__script {
            font-size: 22px;
        }
    }
</style>
