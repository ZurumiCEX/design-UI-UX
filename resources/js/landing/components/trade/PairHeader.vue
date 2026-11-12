<script setup>
import { computed } from 'vue';
import { USDT_XOF } from '../../content/data.js';
import { useI18n } from '../../composables/useI18n.js';
import ZSelect from '../ui/ZSelect.vue';

// En-tête de la paire : sélecteur, dernier cours, statistiques 24 h.
const props = defineProps({
  sim: { type: Object, required: true }, // état du simulateur
  pair: { type: Object, required: true },
  coin: { type: Object, required: true },
  options: { type: Array, required: true }, // options du sélecteur de paires
  data: { type: Object, required: true }, // pages.trade
});
const pairId = defineModel({ type: String, required: true });
const { fmt, t } = useI18n();

const change = computed(() => (props.sim.last / props.sim.open24 - 1) * 100);
const up = computed(() => props.sim.last >= props.sim.prev);
const price = (v) => fmt.num(v, props.sim.decimals);
</script>

<template>
  <div class="ph">
    <div class="ph__pair">
      <ZSelect
        v-model="pairId"
        variant="plain"
        class="ph__select"
        :options="options"
        :label="data.pair.label"
        searchable
        :search-label="data.pair.search"
        :empty="data.pair.empty"
      />
      <span class="ph__name">{{ coin.name }}</span>
    </div>

    <div class="ph__last">
      <span class="ph__price num" :class="up ? 'is-up' : 'is-down'">{{ price(sim.last) }}</span>
      <span v-if="pair.quote === 'USDT'" class="ph__fiat num">≈ {{ fmt.xof(sim.last * USDT_XOF) }}</span>
    </div>

    <dl class="ph__stats" :aria-label="data.stats.label">
      <div>
        <dt>{{ data.stats.change }}</dt>
        <dd class="num" :class="change >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(change) }}</dd>
      </div>
      <div>
        <dt>{{ data.stats.high }}</dt>
        <dd class="num">{{ price(sim.high24) }}</dd>
      </div>
      <div>
        <dt>{{ data.stats.low }}</dt>
        <dd class="num">{{ price(sim.low24) }}</dd>
      </div>
      <div>
        <dt>{{ t(data.stats.volume, { ticker: pair.base }) }}</dt>
        <dd class="num">{{ fmt.compact(sim.volBase) }}</dd>
      </div>
      <div>
        <dt>{{ t(data.stats.volume, { ticker: pair.quote }) }}</dt>
        <dd class="num">{{ fmt.compact(sim.volQuote) }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.ph { display: flex; align-items: center; gap: 28px; min-height: 64px; padding: 8px 20px; overflow-x: auto; scrollbar-width: none; }
.ph__pair { display: grid; flex: none; }
.ph__select :deep(.zs__btn) { font-size: 17px; font-weight: var(--font-weight-semibold); }
.ph__name { font-size: 11px; color: var(--color-text-dim); }
.ph__last { display: grid; flex: none; }
.ph__price { font-size: 20px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; line-height: 1.2; }
.ph__fiat { font-size: 11px; color: var(--color-text-muted); }
.ph__stats { display: flex; gap: 28px; margin: 0; }
.ph__stats div { flex: none; }
.ph__stats dt { font-size: 11px; color: var(--color-text-dim); white-space: nowrap; }
.ph__stats dd { margin: 2px 0 0; font-size: 13px; font-weight: var(--font-weight-medium); }
@media (max-width: 760px) {
  .ph { flex-wrap: wrap; gap: 8px 20px; padding: 10px var(--space-gutter-mobile); }
  .ph__stats { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 16px; }
  .ph__stats div:nth-child(n + 4) { display: none; }
}
</style>
