<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import { useScrollFrame } from '../../composables/useScrollProgress.js';
import ZIcon from './ZIcon.vue';

// « Haut de page » : un anneau qui se remplit avec la progression du défilement ;
// au survol, la flèche monte et l'anneau tourne. Un clic remonte en douceur (instantané en mouvement réduit).
defineProps({ label: { type: String, required: true } });
const C = 2 * Math.PI * 22;
const progress = ref(0);
// La hauteur de page est mesurée au redimensionnement, jamais pendant le scroll :
// la lire à chaque image forcerait le navigateur à recalculer toute la mise en page.
let max = 0;
let ro;
const measure = () => (max = document.documentElement.scrollHeight - window.innerHeight);
onMounted(() => {
  measure();
  ro = new ResizeObserver(measure);
  ro.observe(document.documentElement);
  window.addEventListener('resize', measure, { passive: true });
});
onBeforeUnmount(() => {
  ro?.disconnect();
  window.removeEventListener('resize', measure);
});
useScrollFrame((y) => {
  const next = max > 0 ? Math.min(1, y / max) : 0;
  if (Math.abs(next - progress.value) > 0.001) progress.value = next;
});
function top() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  document.getElementById('top')?.focus?.({ preventScroll: true });
}
</script>

<template>
  <button type="button" class="btt" :aria-label="label" :title="label" @click="top">
    <svg class="btt__ring" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" class="btt__track" />
      <circle cx="24" cy="24" r="22" class="btt__bar" :stroke-dasharray="C" :stroke-dashoffset="C * (1 - progress)" />
    </svg>
    <span class="btt__arrow"><ZIcon name="arrow-up" :size="18" /></span>
  </button>
</template>

<style scoped>
.btt { position: relative; display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--color-bg-surface-2); overflow: hidden; transition: background-color var(--motion-duration-hover), box-shadow var(--motion-duration-hover); }
.btt:hover { background: var(--fill-2); box-shadow: 0 0 30px -8px var(--glow-brand); }
.btt__ring { position: absolute; inset: 0; transform: rotate(-90deg); transition: transform 900ms var(--motion-ease-out); }
.btt:hover .btt__ring { transform: rotate(270deg); }
.btt__ring circle { fill: none; stroke-width: 2; }
.btt__track { stroke: var(--color-line-strong); }
.btt__bar { stroke: url(#z-grad-soft); stroke-linecap: round; transition: stroke-dashoffset 120ms linear; }
.btt__arrow { position: relative; display: grid; color: var(--color-text-default); }
.btt:hover .btt__arrow { animation: btt-up 700ms var(--motion-ease-out); }
@keyframes btt-up { 0% { transform: none; } 45% { transform: translateY(-26px); opacity: 0; } 46% { transform: translateY(26px); opacity: 0; } 100% { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .btt:hover .btt__ring { transform: rotate(-90deg); } .btt:hover .btt__arrow { animation: none; } }
</style>
