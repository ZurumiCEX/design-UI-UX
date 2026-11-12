<script setup>
import { computed } from 'vue';
import ZButton from '../ui/ZButton.vue';
import ZCoinChip from '../ui/ZCoinChip.vue';
import ZTag from '../ui/ZTag.vue';

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A11 — deux rangées en défilement infini, sens opposés.
const COPIES = 4; // assez de copies pour couvrir les très grands écrans
const rows = computed(() => [props.common.coins, [...props.common.coins].reverse()]);
</script>

<template>
  <section :id="data.id" class="section section--center coins">
    <div class="container">
      <ZTag v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title coins__title" v-html="data.title" />
    </div>

    <div v-reveal class="coins__rows">
      <div
        v-for="(row, r) in rows"
        :key="r"
        class="coins__row"
        :class="{ 'is-reverse': r % 2 }"
        :style="{ '--speed': `${data.speeds[r % data.speeds.length]}s` }"
      >
        <div class="coins__track">
          <ul v-for="copy in COPIES" :key="copy" :aria-hidden="copy > 1 || r > 0 ? 'true' : undefined">
            <li v-for="coin in row" :key="coin.id"><ZCoinChip :coin="coin" /></li>
          </ul>
        </div>
      </div>
    </div>

    <ZButton v-reveal size="lg" :href="data.cta.href">{{ data.cta.label }}</ZButton>
  </section>
</template>

<style scoped>
.coins__title { margin-top: 26px; }
.coins__rows {
  display: grid; gap: 16px; margin: 56px 0 48px; overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent);
}
.coins__track { display: flex; width: max-content; animation: coins-marquee var(--speed) linear infinite; }
.is-reverse .coins__track { animation-direction: reverse; }
.coins__row:hover .coins__track { animation-play-state: paused; }
.coins__track ul { display: flex; }
.coins__track li { padding-right: 14px; }
@keyframes coins-marquee { to { transform: translateX(-25%); } }
@media (prefers-reduced-motion: reduce) { .coins__track { animation: none; } }
</style>
