<script setup>
import { computed } from 'vue';
import { brandLogo } from '../../content/data.js';
import { useTheme } from '../../composables/useTheme.js';

// Logo. `variant` : 'full' (logo officiel avec slogan), 'compact' (sans slogan, barre de navigation)
// ou 'mark' (petit « Z » dessiné, pour les maquettes d'interface). `size` = hauteur en px.
const props = defineProps({
  brand: { type: String, default: '' },
  size: { type: Number, default: 22 },
  wordmark: { type: Boolean, default: true },
  image: { type: String, default: '' },
  variant: { type: String, default: 'mark' },
  dark: { type: Boolean, default: false }, // posé sur une zone toujours sombre
});
const { theme } = useTheme();
// Thème clair : version foncée du logo, sauf si `dark` force la version claire (zone sombre).
const src = computed(() => {
  if (props.image) return props.image;
  const light = theme.theme === 'light' && !props.dark;
  if (props.variant === 'full') return light ? brandLogo.fullLight : brandLogo.full;
  if (props.variant === 'compact') return light ? brandLogo.compactLight : brandLogo.compact;
  return '';
});
</script>

<template>
  <span class="z-logo" :style="{ '--s': `${size}px` }">
    <img v-if="src" :src="src" :alt="brand" :height="size" :width="Math.round(size * brandLogo.ratio)" class="z-logo__img" decoding="async" />
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
.z-logo__img { flex: none; height: var(--s); width: auto; max-width: none; }
</style>
