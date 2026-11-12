<script setup>
// Bouclier (A16). Le parent pilote la rotation 3D via --p.
// `image` : { avif, webp, src, width, height, alt } pour un rendu 3D fourni.
defineProps({ image: { type: Object, default: null } });
</script>

<template>
  <picture v-if="image">
    <source v-if="image.avif" :srcset="image.avif" type="image/avif" />
    <source v-if="image.webp" :srcset="image.webp" type="image/webp" />
    <img :src="image.src" :alt="image.alt" :width="image.width" :height="image.height" loading="lazy" decoding="async" />
  </picture>
  <svg v-else class="shield" viewBox="0 0 280 320" aria-hidden="true">
    <path class="shield__body" d="M140 6 268 54v92c0 78-48 130-128 164C60 276 12 224 12 146V54L140 6Z" />
    <path class="shield__inner" d="M140 30 248 70v76c0 64-40 108-108 138C72 254 32 210 32 146V70l108-40Z" />
    <path class="shield__z" d="M98 112h88l-58 76h58v20H94l58-76H98v-20Z" />
  </svg>
</template>

<style scoped>
.shield { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 40px 50px var(--ink)); }
.shield__body { fill: url(#z-grad-surface); stroke: var(--color-text-dim); stroke-width: 2; }
.shield__inner { fill: none; stroke: var(--color-line-strong); stroke-width: 1.5; }
.shield__z { fill: url(#z-grad-soft); }
</style>
