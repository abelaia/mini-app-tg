<script setup>
    import { computed } from 'vue'
    import { useRoute } from 'vue-router'

    const route = useRoute()
    const base = `${import.meta.env.BASE_URL}assets/backgrounds/`
    const scenes = {
        '/': { image: 'today', variant: 'today' },
        '/week': { image: 'week', variant: 'week' },
        '/reminders': { image: 'reminders', variant: 'reminders' },
        '/about': { image: 'week', variant: 'about' },
        '/admin': { image: 'today', variant: 'admin' },
    }
    const scene = computed(() => scenes[route.path] ?? scenes['/'])
</script>

<template>
    <div
        class="app-background"
        :data-scene="scene.variant"
        aria-hidden="true"
    >
        <div
            class="app-background__image"
            :style="{ backgroundImage: `url('${base}${scene.image}.webp')` }"
        />
    </div>
</template>

<style lang="scss">
    .app-background {
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
        background: var(--color-bg);

        &__image {
            width: min(100%, 720px);
            height: 100%;
            margin-inline: auto;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
        }

        &[data-scene='about'] &__image {
            transform: scaleX(-1);
        }

        &[data-scene='admin'] &__image {
            opacity: 0.35;
            transform: scaleX(-1);
        }
    }

    @media (min-width: 721px) {
        .app-background__image {
            mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
        }
    }

    :root[data-theme='dark'] .app-background__image {
        opacity: 0.1;
        mix-blend-mode: luminosity;
    }

    :root[data-theme='dark'] .app-background[data-scene='admin'] .app-background__image {
        opacity: 0.05;
    }
</style>
