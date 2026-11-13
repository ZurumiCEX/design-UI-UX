<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import { whenReady } from '../../composables/useReveal.js';
import { useScrollFrame } from '../../composables/useScrollProgress.js';
import GlobeRates from '../visuals/GlobeRates.vue';
import MatrixBackground from '../visuals/MatrixBackground.vue';

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A6 — compteurs : 0 → valeur en 1,4 s (décélération cubique), 1,9 s après le chargement.
const COUNT_DELAY = 1900;
const COUNT_DURATION = 1400;
const counts = ref(props.data.stats.map((s) => (prefersReducedMotion() ? s.value : 0)));
let raf = 0;
let timer = 0;

onMounted(() => {
  if (prefersReducedMotion()) return;
  whenReady().then(() => {
    timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / COUNT_DURATION);
        const eased = 1 - (1 - t) ** 3;
        counts.value = props.data.stats.map((s) => Math.round((s.value ?? 0) * eased));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, COUNT_DELAY);
  });
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelAnimationFrame(raf);
});
// A4 — parallaxe du globe : --sy (0 → 1 sur la première hauteur d'écran), écrit sur le hero seul
// et seulement tant qu'il est à l'écran.
const root = ref(null);
let lastSy = -1;
useScrollFrame((y) => {
  const sy = Math.min(1, Math.max(0, y / window.innerHeight));
  if (sy === lastSy || (sy === 1 && lastSy === 1) || !root.value) return;
  lastSy = sy;
  root.value.style.setProperty('--sy', sy.toFixed(4));
});
</script>

<template>
  <section :id="data.id" ref="root" class="hero">
    <MatrixBackground />
    <div class="hero__halo" aria-hidden="true" />

    <div class="container hero__layout">
      <div class="hero__copy">
        <h1 v-split class="title title--display" v-html="data.title" />
        <span class="hero__loader" aria-hidden="true" />
        <p v-reveal="700" class="lede hero__text">{{ data.text }}</p>
      </div>

      <dl class="hero__stats">
        <div v-for="(stat, i) in data.stats" :key="stat.label" v-reveal="1700 + i * 100">
          <dt class="label">{{ stat.label }}</dt>
          <dd>
            <template v-if="stat.text">{{ stat.text }}</template>
            <template v-else>{{ stat.prefix }}{{ counts[i] }}{{ stat.suffix }}</template>
          </dd>
        </div>
      </dl>
    </div>

    <!-- A4 — parallaxe sur l'enveloppe, entrée sur l'élément intérieur. -->
    <div class="hero__globe">
      <div class="hero__globe-in">
        <GlobeRates :coins="common.coins" :rates="data.rates" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero { position: relative; min-height: max(100svh, 820px); overflow: hidden; display: flex; }
.hero__halo {
  position: absolute; left: 38%; top: -10%; width: 70%; aspect-ratio: 1; pointer-events: none;
  background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.38;
}
.hero__layout { position: relative; z-index: 1; display: flex; flex-direction: column; padding-top: 140px; padding-bottom: 64px; }
.hero__copy { max-width: 560px; }
.hero__loader { display: block; width: 96px; height: 2px; margin-top: 18px; border-radius: var(--radius-pill); background: var(--gradient-brand-soft); transform-origin: 0 50%; opacity: 0; }
:global(.js.ready .hero__loader) { animation: hero-loader var(--motion-duration-reveal) var(--motion-ease-out) 200ms both; }
@keyframes hero-loader { 0% { opacity: 1; transform: scaleX(0); } 70% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(1); } }
.hero__text { margin-top: 14px; max-width: 42ch; }
.hero__stats { display: flex; flex-wrap: wrap; gap: 24px 56px; margin-top: auto; padding-top: 56px; }
.hero__stats dt { color: var(--color-text-dim); }
.hero__stats dd { margin: 8px 0 0; font-size: 22px; font-weight: var(--font-weight-medium); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

.hero__globe { position: absolute; left: 50%; top: 96px; width: min(760px, 56vw); aspect-ratio: 1; transform: translateY(calc(var(--sy, 0) * -60px)); pointer-events: none; }
.hero__globe-in { width: 100%; height: 100%; }
:global(.js .hero__globe-in) { opacity: 0; transform: scale(0.92); }
:global(.js.ready .hero__globe-in) {
  opacity: 1; transform: none;
  transition: transform var(--motion-duration-hero-mock) var(--motion-ease-out) var(--seq-mock), opacity var(--motion-duration-hero-mock) var(--motion-ease-out) var(--seq-mock);
}

@media (max-width: 900px) {
  .hero { flex-direction: column; min-height: 0; }
  .hero__layout { padding-top: 112px; padding-bottom: 0; }
  .hero__stats { display: grid; grid-template-columns: 1fr 1fr; margin-top: 0; }
  .hero__globe { position: relative; left: auto; top: auto; align-self: flex-end; width: min(520px, 118vw); margin: 24px -18vw 0 0; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  :global(.js .hero__globe-in) { opacity: 1; transform: none; }
  .hero__globe { transform: none; }
}
</style>
