<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import { whenReady } from '../../composables/useReveal.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
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

function onSubmit(e) {
  if (props.data.form.action === '#') e.preventDefault(); // route d'inscription à brancher
}
</script>

<template>
  <section :id="data.id" class="hero">
    <MatrixBackground />
    <div class="hero__halo" aria-hidden="true" />

    <div class="container hero__layout">
      <div class="hero__copy">
        <h1 v-split class="title title--display" v-html="data.title" />
        <span class="hero__loader" aria-hidden="true" />
        <p v-reveal="700" class="lede hero__text">{{ data.text }}</p>
        <form v-reveal="900" class="hero__form" :action="data.form.action" method="get" @submit="onSubmit">
          <label class="sr-only" for="hero-id">{{ data.form.placeholder }}</label>
          <input id="hero-id" name="identifier" type="text" autocomplete="username" :placeholder="data.form.placeholder" />
          <ZButton type="submit">{{ data.form.submit }}</ZButton>
        </form>
        <div v-reveal="1100" class="hero__social">
          <span class="label">{{ data.social.label }}</span>
          <a v-for="p in data.social.providers" :key="p.id" :href="p.href" :aria-label="p.label" class="hero__provider">
            <ZIcon :name="p.id" :size="16" />
          </a>
        </div>
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
.hero__form { display: flex; gap: 8px; margin-top: 28px; max-width: 330px; }
.hero__form input {
  flex: 1; min-width: 0; height: 36px; padding: 0 12px; font-size: 13px; border-radius: var(--radius-sm);
  background: var(--fill-2); border: 1px solid var(--color-line-default); outline-offset: 0;
  transition: border-color var(--motion-duration-hover);
}
.hero__form input::placeholder { color: var(--color-text-dim); }
.hero__form input:focus { border-color: var(--color-brand-secondary-300); }
.hero__social { display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--color-text-dim); }
.hero__social .label { margin-right: 4px; }
.hero__provider {
  display: grid; place-items: center; width: 30px; height: 30px; border-radius: var(--radius-sm); color: var(--color-text-default);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default);
  transition: transform var(--motion-duration-hover) var(--motion-ease-out), background-color var(--motion-duration-hover);
}
.hero__provider:hover { transform: translateY(-1px); background: var(--fill-2); }
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
