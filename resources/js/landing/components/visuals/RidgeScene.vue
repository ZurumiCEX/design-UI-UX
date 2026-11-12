<script setup>
// Crête de montagne de la bannière ciel (A13) : crêtes arrière, crête avant avec
// ligne lumineuse et silhouette. Le parent pilote la parallaxe via --in.
// `image` : { avif, webp, src, width, height, alt } pour une illustration fournie.
defineProps({ image: { type: Object, default: null } });
</script>

<template>
  <picture v-if="image" class="ridge ridge--img">
    <source v-if="image.avif" :srcset="image.avif" type="image/avif" />
    <source v-if="image.webp" :srcset="image.webp" type="image/webp" />
    <img :src="image.src" :alt="image.alt" :width="image.width" :height="image.height" loading="lazy" decoding="async" />
  </picture>
  <div v-else class="ridge" aria-hidden="true">
    <svg class="ridge__back" viewBox="0 0 1440 420" preserveAspectRatio="none">
      <path d="M0 260 140 214l120 58 160-106 150 84 240 36 110-56 160-90 140 72 220-98v306H0Z" />
    </svg>
    <div class="ridge__front">
    <svg viewBox="0 0 1440 420" preserveAspectRatio="none">
      <path class="ridge__land" d="M0 330 50 320l176 22 152-116 134-58 114-42 92-12 96 34 120 66 126 46 164-34 216-80v274H0Z" />
      <path class="ridge__glow" d="M226 342 378 226l134-58 114-42 92-12 96 34 120 66 126 46" />
      <path class="ridge__line" d="M226 342 378 226l134-58 114-42 92-12 96 34 120 66 126 46" />
    </svg>
    <!-- silhouette : hors du SVG étiré pour garder ses proportions -->
    <svg class="ridge__hiker" viewBox="0 0 50 110">
      <circle cx="27" cy="9" r="9" />
      <path d="M17 22h16l6 34-7 2-1-8-3 22 6 36h-8l-5-32-5 32h-8l6-40-2-24h-8a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4h8Z" />
      <rect x="43" y="30" width="3" height="78" rx="1.5" />
    </svg>
    </div>
  </div>
</template>

<style scoped>
.ridge { position: absolute; inset: auto 0 0; height: 46%; min-height: 300px; pointer-events: none; }
.ridge--img img { width: 100%; height: 100%; object-fit: cover; }
.ridge svg { position: absolute; left: 0; bottom: 0; width: 100%; height: 100%; overflow: visible; }
.ridge__back { fill: color-mix(in srgb, var(--color-sky-mid) 80%, var(--color-sky-top)); transform: translateY(calc((1 - var(--in, 1)) * 8%)); }
.ridge__front { position: absolute; inset: 0; transform: translateY(calc((1 - var(--in, 1)) * 18%)); }
.ridge__land { fill: var(--color-bg-surface); }
.ridge__line { fill: none; stroke: url(#z-grad-soft); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ridge__glow { fill: none; stroke: var(--color-brand-primary-300); stroke-width: 14; stroke-linejoin: round; vector-effect: non-scaling-stroke; filter: blur(10px); opacity: 0.55; }
.ridge .ridge__hiker {
  left: 49.9%; bottom: 72%; width: 46px; height: auto; margin-left: -34px; fill: var(--color-bg-base);
}
</style>
