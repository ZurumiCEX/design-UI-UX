<script setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import ZCoinChip from '../ui/ZCoinChip.vue';

// A20 — globe en points + cartes de cours qui tournent (la première passe en dernier).
// Le canvas du globe est chargé à part pour ne pas alourdir le premier rendu.
const DotGlobe = defineAsyncComponent(() => import('./DotGlobe.vue'));

const props = defineProps({
  coins: { type: Array, required: true },
  rates: { type: Object, default: () => ({ interval: 2200, count: 4 }) },
});

const root = ref(null);
const list = ref(props.coins.slice(0, props.rates.count));
let timer = 0;
let io;
const stop = () => { clearInterval(timer); timer = 0; };
function start() {
  stop();
  if (prefersReducedMotion()) return;
  timer = setInterval(() => list.value.push(list.value.shift()), props.rates.interval);
}
onMounted(() => {
  // La rotation ne tourne que lorsque le visuel est à l'écran.
  io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
  io.observe(root.value);
});
onBeforeUnmount(() => { stop(); io?.disconnect(); });
</script>

<template>
  <div ref="root" class="gr" aria-hidden="true">
    <div class="gr__globe"><DotGlobe /></div>
    <TransitionGroup tag="ul" name="gr-rates" class="gr__rates">
      <li v-for="(coin, i) in list" :key="coin.id" :style="{ opacity: 1 - i * 0.28 }"><ZCoinChip :coin="coin" /></li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.gr { position: relative; width: 100%; height: 100%; }
.gr__globe { position: absolute; inset: 0; }
.gr__rates { position: absolute; left: 2%; top: 42%; display: grid; gap: 10px; width: 232px; }
.gr__rates li { transition: opacity var(--duration-rule) var(--motion-ease-out); }
.gr-rates-move { transition: transform var(--duration-rule) var(--motion-ease-out), opacity var(--duration-rule) var(--motion-ease-out); }
</style>
