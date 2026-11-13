<script setup>
import ZIcon from '../ui/ZIcon.vue';

// Le sceau — élément signature de Zurumi Verify : il balaie pendant la vérification,
// se fige au résultat, et sa couleur donne le verdict d'un coup d'œil.
defineProps({
  tone: { type: String, default: 'scanning' }, // scanning | verified | neutral | warning | danger
  icon: { type: String, default: 'check' },
  size: { type: Number, default: 112 },
});
</script>

<template>
  <div class="seal" :class="`seal--${tone}`" :style="{ '--s': `${size}px` }" aria-hidden="true">
    <template v-if="tone !== 'scanning'">
      <span class="seal__ring" />
      <span class="seal__ring seal__ring--late" />
    </template>
    <svg class="seal__dial" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity="0.16" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-opacity="0.1" />
      <g v-if="tone === 'scanning'" class="seal__sweep">
        <path d="M50 4 A46 46 0 0 1 88 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </g>
    </svg>
    <div class="seal__core" :class="{ 'is-shake': tone === 'danger' || tone === 'warning' }">
      <svg v-if="icon === 'check'" viewBox="0 0 24 24" class="seal__check" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path class="seal__mark" d="m5 12.6 4.6 4.6L19 7.8" />
      </svg>
      <ZIcon v-else :name="icon" :size="Math.round(size * 0.26)" />
    </div>
  </div>
</template>

<style scoped>
.seal { position: relative; display: grid; place-items: center; width: var(--s); height: var(--s); color: var(--color-brand-primary-300); }
.seal--neutral { color: var(--color-brand-secondary-300); }
.seal--warning { color: var(--color-state-warn); }
.seal--danger { color: var(--color-state-down); }
.seal__dial { position: absolute; inset: 0; }
.seal__sweep { transform-origin: 50% 50%; animation: seal-sweep 1.15s linear infinite; }
.seal__ring { position: absolute; inset: 0; border-radius: 50%; border: 1px solid currentColor; opacity: 0.5; animation: seal-ring 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.seal__ring--late { opacity: 0.3; animation-delay: 0.18s; }
.seal__core {
  position: relative; display: grid; place-items: center; width: 54%; height: 54%; border-radius: 50%;
  background: color-mix(in srgb, currentColor 16%, transparent); animation: seal-core 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.seal--verified .seal__core { box-shadow: 0 0 42px -6px color-mix(in srgb, currentColor 70%, transparent); }
.seal__core.is-shake { animation: seal-core 0.5s cubic-bezier(0.16, 1, 0.3, 1) both, seal-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.1s; }
.seal__check { width: 50%; height: 50%; }
.seal__mark { stroke-dasharray: 48; stroke-dashoffset: 48; animation: seal-draw 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.24s forwards; }
@keyframes seal-sweep { to { transform: rotate(360deg); } }
@keyframes seal-ring { from { transform: scale(0.62); opacity: 0.85; } to { transform: scale(1.25); opacity: 0; } }
@keyframes seal-core { from { transform: scale(0.7); opacity: 0; } }
@keyframes seal-draw { to { stroke-dashoffset: 0; } }
@keyframes seal-shake { 0%, 100% { translate: 0; } 20% { translate: -5px; } 45% { translate: 4px; } 70% { translate: -2px; } }
@media (prefers-reduced-motion: reduce) {
  .seal__sweep, .seal__ring, .seal__core, .seal__core.is-shake { animation: none; }
  .seal__ring { display: none; }
  .seal__mark { stroke-dashoffset: 0; animation: none; }
}
</style>
