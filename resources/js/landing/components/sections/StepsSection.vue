<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import ZButton from '../ui/ZButton.vue';
import ZLogo from '../ui/ZLogo.vue';

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A19 — étape active en cycle automatique ; un clic sélectionne et relance le cycle.
const active = ref(0);
const root = ref(null);
let timer = 0;
let io;

function stop() {
  clearInterval(timer);
  timer = 0;
}
function start() {
  stop();
  if (prefersReducedMotion()) return; // pas de cycle automatique en mouvement réduit
  timer = setInterval(() => (active.value = (active.value + 1) % props.data.items.length), props.data.interval);
}
function select(i) {
  active.value = i;
  start();
}

onMounted(() => {
  // le cycle ne tourne que lorsque la section est à l'écran
  io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  io.observe(root.value);
});
onBeforeUnmount(() => {
  stop();
  io?.disconnect();
});

const ORBIT_COPIES = 6;
</script>

<template>
  <section :id="data.id" ref="root" class="section steps">
    <!-- A18 — orbe au logo, rangées d'icônes en défilement opposé. -->
    <div class="orb" aria-hidden="true">
      <div v-for="row in 2" :key="row" class="orb__row" :class="{ 'is-reverse': row === 2 }">
        <div class="orb__track">
          <span v-for="n in data.orbit.length * ORBIT_COPIES" :key="n" class="orb__chip">{{ data.orbit[(n - 1) % data.orbit.length] }}</span>
        </div>
      </div>
      <div class="orb__core">
        <span class="orb__halo orb__halo--a" /><span class="orb__halo orb__halo--b" />
        <ZLogo :size="34" :wordmark="false" />
      </div>
    </div>

    <div class="container steps__layout">
      <div>
        <h2 v-split class="title steps__title" v-html="data.title" />
        <p v-reveal class="steps__text">{{ data.text }}</p>
        <ZButton v-reveal variant="pill" :href="data.cta.href">{{ data.cta.label }}</ZButton>
      </div>

      <ol class="steps__list" :aria-label="data.listLabel" :style="{ '--count': data.items.length, '--active': active }">
        <li v-for="(item, i) in data.items" :key="item.title" :class="{ 'is-active': i === active }">
          <button type="button" :aria-current="i === active ? 'step' : undefined" @click="select(i)">
            <span class="steps__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="steps__body"><strong>{{ item.title }}</strong> {{ item.text }}</span>
          </button>
        </li>
        <span class="steps__thumb" aria-hidden="true" />
      </ol>
    </div>
  </section>
</template>

<style scoped>
.steps { padding-top: 40px; }
.orb { position: relative; display: grid; gap: 26px; padding: 64px 0; margin-bottom: 60px; overflow: hidden; }
.orb__row {
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
}
.orb__track { display: flex; width: max-content; animation: orb-marquee 60s linear infinite; }
.is-reverse .orb__track { animation-direction: reverse; }
.orb__chip {
  display: grid; place-items: center; width: 34px; height: 34px; margin-right: 28px; border-radius: 50%; flex: none;
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-dim); font-size: 13px; font-weight: var(--font-weight-semibold);
}
@keyframes orb-marquee { to { transform: translateX(calc(-100% / 3)); } }
.orb__core {
  position: absolute; left: 50%; top: 50%; width: 86px; height: 86px; margin: -43px 0 0 -43px; display: grid; place-items: center; border-radius: 50%;
  background: radial-gradient(circle at 50% 35%, var(--color-brand-primary), var(--color-bg-surface) 75%); border: 1px solid var(--color-line-strong);
}
.orb__halo { position: absolute; inset: -62px; border-radius: 50%; z-index: -1; animation: orb-pulse 3.2s ease-in-out infinite; }
.orb__halo--a { background: radial-gradient(closest-side, var(--color-brand-primary), transparent); }
.orb__halo--b { background: radial-gradient(closest-side, var(--color-brand-secondary), transparent); animation-delay: -1.6s; }
@keyframes orb-pulse { 0%, 100% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 0.75; transform: scale(1.12); } }

.steps__layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 60px; max-width: 980px; }
.steps__title { font-size: clamp(32px, 3.4vw, 46px); }
.steps__text { margin: 22px 0 26px; font-size: 13.5px; color: var(--color-text-muted); }
.steps__list { position: relative; display: grid; grid-auto-rows: 1fr; padding-left: 22px; border-left: 1px solid var(--color-line-default); }
.steps__list button { display: grid; gap: 10px; width: 100%; padding: 12px 0; text-align: left; opacity: 0.34; transition: opacity var(--duration-rule) var(--motion-ease-out); }
.steps__list button:hover { opacity: 0.7; }
.steps__list .is-active button { opacity: 1; }
.steps__num {
  position: relative; isolation: isolate; justify-self: start; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: var(--font-weight-semibold); letter-spacing: 0.06em;
  border: 1px solid var(--color-line-strong);
}
.steps__num::before { content: ''; position: absolute; inset: -1px; z-index: -1; border-radius: inherit; background: var(--gradient-brand); opacity: 0; transition: opacity var(--duration-rule); }
.is-active .steps__num::before { opacity: 1; }
.steps__body { font-size: 14.5px; color: var(--color-text-muted); max-width: 44ch; }
.steps__body strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
/* indicateur vertical : glisse d'un tiers à chaque étape */
.steps__thumb {
  position: absolute; left: -1px; top: 0; width: 1px; height: calc(100% / var(--count)); background: var(--gradient-brand-soft);
  transform: translateY(calc(var(--active) * 100%)); transition: transform var(--duration-rule) var(--motion-ease-out);
}
@media (max-width: 900px) {
  .steps__layout { grid-template-columns: 1fr; gap: 40px; }
  .orb { margin-bottom: 56px; }
}
@media (prefers-reduced-motion: reduce) { .orb__track, .orb__halo { animation: none; } .orb__halo { opacity: 0.4; } }
</style>
