<script setup>
// Logo. Le « Z » est un SUBSTITUT : passez `image` (logo officiel) pour le remplacer.
defineProps({
  brand: { type: String, default: '' },
  size: { type: Number, default: 22 },
  wordmark: { type: Boolean, default: true },
  image: { type: String, default: '' },
});
</script>

<template>
  <span class="z-logo" :style="{ '--s': `${size}px` }">
    <img v-if="image" :src="image" :alt="brand" :height="size" class="z-logo__img" />
    <template v-else>
      <svg class="z-logo__mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="6" class="z-logo__tile" />
        <path d="M8 8h8l-8 8h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span v-if="wordmark" class="z-logo__word">{{ brand }}</span>
    </template>
  </span>
</template>

<style scoped>
.z-logo { display: inline-flex; align-items: center; gap: calc(var(--s) * 0.42); color: var(--color-text-default); }
.z-logo__mark { width: var(--s); height: var(--s); flex: none; }
.z-logo__tile { fill: url(#z-grad-brand); }
.z-logo__word { font-size: calc(var(--s) * 0.82); font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; line-height: 1; }
.z-logo__img { height: var(--s); width: auto; }
</style>
