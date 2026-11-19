<script setup>
    const base = `${import.meta.env.BASE_URL}assets/banner/`
</script>

<template>
    <div
        class="community-banner"
        aria-label="Türk Dizi Online — сообщество онлайн-переводов"
    >
        <img
            class="community-banner__scene"
            :src="`${base}promo-olive-v2.webp`"
            alt=""
            fetchpriority="high"
        />
        <div class="community-banner__print">
            <img
                :src="`${base}community-avatar-original.png`"
                alt="Türk Dizi Online"
            />
        </div>
    </div>
</template>

<style lang="scss">
    .community-banner {
        position: relative;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border-radius: 14px;

        &__scene {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
        }

        &__print {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) rotate(-2deg);
            width: 31%;
            padding: 5px;
            background: #fff9eb;
            box-shadow: 0 5px 13px rgba(32, 25, 15, 0.24);

            img {
                display: block;
                width: 100%;
                aspect-ratio: 1;
                object-fit: contain;
            }
        }
    }
</style>
