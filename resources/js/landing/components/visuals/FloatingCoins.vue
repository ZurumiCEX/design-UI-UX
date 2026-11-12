<script setup>
// Pièces flottantes (A15) : flottement continu + déplacement lié au scroll (--p du parent).
// `image` : { avif, webp, src, width, height, alt } pour un rendu 3D fourni.
defineProps({
  coins: { type: Array, required: true }, // [{ glyph, x, y, size, drift, delay }]
  image: { type: Object, default: null },
});
</script>

<template>
  <picture v-if="image" class="coins-img">
    <source v-if="image.avif" :srcset="image.avif" type="image/avif" />
    <source v-if="image.webp" :srcset="image.webp" type="image/webp" />
    <img :src="image.src" :alt="image.alt" :width="image.width" :height="image.height" loading="lazy" decoding="async" />
  </picture>
  <div v-else class="coins" aria-hidden="true">
    <span
      v-for="(coin, i) in coins"
      :key="i"
      class="coins__slot"
      :style="{ left: `${coin.x}%`, top: `${coin.y}%`, '--size': `${coin.size}px`, '--drift': `${coin.drift}px`, '--delay': `${coin.delay}s` }"
    >
      <span class="coins__coin">{{ coin.glyph }}</span>
    </span>
  </div>
</template>

<style scoped>
.coins { position: absolute; inset: 0; pointer-events: none; }
.coins-img { position: absolute; inset: 0; }
.coins-img img { width: 100%; height: 100%; object-fit: contain; }
/* scroll : amplitude propre à chaque pièce */
.coins__slot { position: absolute; transform: translateY(calc((var(--p, 0.5) - 0.5) * var(--drift))); }
.coins__coin {
  display: grid; place-items: center; width: var(--size); height: calc(var(--size) * 1.16); border-radius: 50%;
  background: radial-gradient(circle at 35% 25%, var(--color-text-dim), var(--color-bg-surface-2) 55%, var(--color-bg-surface));
  box-shadow: inset 0 1px 0 var(--color-line-strong), 0 24px 40px -18px var(--ink);
  color: var(--color-brand-primary-300); font-size: calc(var(--size) * 0.38); font-weight: var(--font-weight-semibold);
  animation: coin-float 5s ease-in-out var(--delay) infinite alternate;
}
@keyframes coin-float { from { transform: translateY(-9px); } to { transform: translateY(9px); } }
</style>
