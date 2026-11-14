<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useTheme } from '../../composables/useTheme.js';
import ZIcon from '../ui/ZIcon.vue';

// Bascule clair / sombre : l'icône montre le thème vers lequel on passe.
const { i18n } = useI18n();
const { theme, toggle } = useTheme();
const labels = computed(() => i18n.content.nav.theme);
const next = computed(() => (theme.theme === 'light' ? 'dark' : 'light'));
</script>

<template>
  <button type="button" class="tt" :aria-label="labels[next]" :title="labels[next]" @click="toggle">
    <ZIcon :key="next" :name="next === 'light' ? 'sun' : 'moon'" :size="16" class="tt__icon" />
  </button>
</template>

<style scoped>
.tt { display: grid; place-items: center; width: 34px; height: 34px; border-radius: var(--radius-sm); color: var(--color-text-muted); border: 1px solid var(--color-line-default); transition: color var(--motion-duration-hover), border-color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.tt:hover, .tt:focus-visible { color: var(--color-text-default); border-color: var(--color-line-strong); background: var(--fill-1); }
.tt__icon { animation: tt-in 420ms var(--motion-ease-out); }
@keyframes tt-in { from { opacity: 0; transform: rotate(-90deg) scale(0.6); } }
@media (prefers-reduced-motion: reduce) { .tt__icon { animation: none; } }
</style>
