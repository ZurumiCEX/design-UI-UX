<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZLogo from '../ui/ZLogo.vue';
import CandleChart from './CandleChart.vue';

// Fenêtre du tableau de bord (hero) : liste de paires + graphique en chandeliers.
const props = defineProps({
  data: { type: Object, required: true }, // { label, menu, quote, count, timeframes }
  coins: { type: Array, required: true },
  brand: { type: String, default: '' },
  chartDelay: { type: Number, default: 0 },
});
const { fmt } = useI18n();
const list = computed(() => props.coins.slice(0, props.data.count ?? 8));
const up = (c) => c.change['24h'] >= 0;
</script>

<template>
  <div class="dash" role="img" :aria-label="data.label">
    <div class="dash__inner" aria-hidden="true">
      <div class="dash__dots"><i /><i /><i /></div>
      <div class="dash__menu">
        <ZLogo :brand="brand" :size="14" />
        <span v-for="m in data.menu" :key="m">{{ m }}</span>
      </div>
      <div class="dash__body">
        <div class="dash__pairs">
          <div class="dash__head">
            <ZCoinIcon :glyph="list[0].glyph" :tone="list[0].tone" />
            <span>
              <strong>{{ list[0].ticker }} / {{ data.quote }}</strong>
              <small :class="up(list[0]) ? 'up' : 'down'">{{ fmt.pct(list[0].change['24h']) }}</small>
            </span>
          </div>
          <ul>
            <li v-for="(coin, i) in list" :key="coin.id" :class="{ 'is-on': i === 0 }">
              <span>{{ coin.ticker }} / {{ data.quote }}</span>
              <span :class="up(coin) ? 'up' : 'down'">{{ fmt.pct(coin.change['24h']) }}</span>
            </li>
          </ul>
        </div>
        <div class="dash__chart">
          <div class="dash__frames">
            <span v-for="(t, i) in data.timeframes" :key="t" :class="{ 'is-on': i === 0 }">{{ t }}</span>
          </div>
          <CandleChart :delay="chartDelay" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash {
  width: 780px; height: 488px; border-radius: 14px; overflow: hidden;
  background: linear-gradient(var(--color-bg-surface-2), var(--color-bg-surface));
  border: 1px solid var(--color-line-strong); box-shadow: 0 60px 120px -40px var(--ink), 0 0 120px -40px var(--glow-brand);
}
.dash__inner { display: grid; grid-template-rows: auto auto 1fr; height: 100%; }
.dash__dots { display: flex; gap: 6px; padding: 12px 14px 4px; }
.dash__dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--color-line-strong); }
.dash__menu { display: flex; align-items: center; gap: 18px; padding: 10px 18px 14px; border-bottom: 1px solid var(--color-line-default); font-size: 11px; color: var(--color-text-muted); }
.dash__body { display: grid; grid-template-columns: 200px 1fr; gap: 32px; padding: 16px 14px 0; min-height: 0; }
.dash__head { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 8px; border-bottom: 1px solid var(--color-line-default); }
.dash__head strong { display: block; font-size: 13px; font-weight: var(--font-weight-semibold); }
.dash__head small { font-size: 11px; }
.dash__pairs li { display: flex; justify-content: space-between; padding: 6px 6px; border-radius: var(--radius-sm); font-size: 11px; font-variant-numeric: tabular-nums; }
.dash__pairs li.is-on { background: var(--fill-2); }
.dash__chart { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 12px; min-height: 0; padding-bottom: 40px; }
.dash__frames { display: flex; gap: 16px; font-size: 10.5px; color: var(--color-text-dim); }
.dash__frames .is-on { color: var(--color-text-default); }
.up { color: var(--color-state-up); }
.down { color: var(--color-state-down); }
</style>
