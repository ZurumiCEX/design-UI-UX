<script setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { useNearViewport } from '../../composables/useNearViewport.js';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import ZCoinChip from '../ui/ZCoinChip.vue';
import ZIconTile from '../ui/ZIconTile.vue';
import ZStoreButton from '../ui/ZStoreButton.vue';
import ZTag from '../ui/ZTag.vue';

// Le globe est chargé à la demande, à l'approche du viewport.
const DotGlobe = defineAsyncComponent(() => import('../visuals/DotGlobe.vue'));

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

const root = ref(null);
const near = useNearViewport(root);

// A20 — les cartes de cours tournent : la première passe en dernier.
const rates = ref(props.common.coins.slice(0, props.data.rates.count));
let timer = 0;
let io;
const stop = () => { clearInterval(timer); timer = 0; };
function start() {
  stop();
  if (prefersReducedMotion()) return;
  timer = setInterval(() => rates.value.push(rates.value.shift()), props.data.rates.interval);
}
onMounted(() => {
  io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  io.observe(root.value);
});
onBeforeUnmount(() => { stop(); io?.disconnect(); });
</script>

<template>
  <section :id="data.id" ref="root" class="section globe">
    <div class="globe__visual" aria-hidden="true">
      <DotGlobe v-if="near" />
    </div>

    <div class="container globe__layout">
      <div class="globe__copy">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h2 v-split class="title globe__title" v-html="data.title" />
        <p v-reveal class="lede globe__text">{{ data.text }}</p>
        <ul class="globe__features">
          <li v-for="f in data.features" :key="f.label" v-reveal>
            <ZIconTile :icon="f.icon" :size="26" /> {{ f.label }}
          </li>
        </ul>
        <div v-reveal class="globe__stores">
          <ZStoreButton v-for="store in common.stores" :key="store.id" :store="store" variant="light" />
        </div>
      </div>

      <TransitionGroup tag="ul" name="rates" class="globe__rates" aria-hidden="true">
        <li v-for="(coin, i) in rates" :key="coin.id" :style="{ opacity: 1 - i * 0.28 }"><ZCoinChip :coin="coin" /></li>
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
.globe { overflow: hidden; padding-bottom: calc(var(--space-section-y) * 1.1); }
.globe__visual { position: absolute; right: -180px; top: 50%; width: 820px; height: 820px; margin-top: -410px; pointer-events: none; }
.globe__layout { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 40px; }
.globe__copy { max-width: 760px; }
.globe__title { margin-top: 30px; font-size: clamp(38px, 5.8vw, 80px); }
.globe__text { margin-top: 26px; }
.globe__features { display: grid; gap: 16px; margin: 44px 0 40px; font-size: 14px; }
.globe__features li { display: flex; align-items: center; gap: 14px; }
.globe__stores { display: flex; gap: 8px; }
.globe__rates { display: grid; gap: 10px; width: 232px; flex: none; margin-top: 120px; }
.globe__rates li { transition: opacity var(--duration-rule) var(--motion-ease-out); }
.rates-move { transition: transform var(--duration-rule) var(--motion-ease-out), opacity var(--duration-rule) var(--motion-ease-out); }
@media (max-width: 1100px) { .globe__rates { display: none; } }
@media (max-width: 900px) {
  .globe__visual { right: -240px; width: 560px; height: 560px; margin-top: -280px; opacity: 0.5; }
}
</style>
