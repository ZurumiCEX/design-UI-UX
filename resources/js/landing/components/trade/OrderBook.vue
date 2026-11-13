<script setup>
import { computed, ref } from 'vue';
import { USDT_XOF } from '../../content/data.js';
import { useI18n } from '../../composables/useI18n.js';
import ZIcon from '../ui/ZIcon.vue';

// Carnet d'ordres (ventes en haut, achats en bas) et transactions récentes.
const props = defineProps({
  sim: { type: Object, required: true },
  pair: { type: Object, required: true },
  data: { type: Object, required: true }, // pages.trade.book
});
const emit = defineEmits(['pick', 'group']);
const { fmt, t } = useI18n();

const tab = ref('book');
const view = ref('both'); // both | bids | asks
const rowsPerSide = computed(() => (view.value === 'both' ? 9 : 18));
const asks = computed(() => (view.value === 'bids' ? [] : props.sim.book.asks.slice(0, rowsPerSide.value).reverse()));
const bids = computed(() => (view.value === 'asks' ? [] : props.sim.book.bids.slice(0, rowsPerSide.value)));
const groups = computed(() => [1, 10, 100].map((k) => props.sim.tick * k));
const price = (v) => fmt.num(v, props.sim.decimals);
const qty = (v) => fmt.num(v, props.sim.amountDecimals);
const groupLabel = (g) => fmt.num(g, Math.max(0, -Math.floor(Math.log10(g) + 1e-9)));
const up = computed(() => props.sim.last >= props.sim.prev);
const depth = (row) => `${Math.min(100, (row.total / props.sim.book.max) * 100).toFixed(1)}%`;
const time = (ts) => fmt.date(ts, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const views = ['both', 'bids', 'asks'];
</script>

<template>
  <section class="ob" :aria-label="data.tabs[tab]">
    <div class="ob__head">
      <div class="z-tabs ob__tabs" role="tablist">
        <button v-for="id in ['book', 'trades']" :key="id" type="button" role="tab" class="z-tab" :aria-selected="tab === id" @click="tab = id">
          {{ data.tabs[id] }}
        </button>
      </div>
    </div>

    <template v-if="tab === 'book'">
      <div class="ob__tools">
        <div class="ob__views" role="group" :aria-label="data.views.label">
          <button v-for="v in views" :key="v" type="button" :aria-pressed="view === v" :aria-label="data.views[v]" :title="data.views[v]" @click="view = v">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect v-if="v !== 'bids'" x="1" y="1.5" width="14" height="5.5" rx="1" class="ob__ico-ask" :height="v === 'asks' ? 13 : 5.5" />
              <rect v-if="v !== 'asks'" x="1" :y="v === 'bids' ? 1.5 : 9" width="14" :height="v === 'bids' ? 13 : 5.5" rx="1" class="ob__ico-bid" />
            </svg>
          </button>
        </div>
        <label class="ob__group">
          <span class="sr-only">{{ data.grouping }}</span>
          <select :value="sim.group" @change="emit('group', Number($event.target.value))">
            <option v-for="g in groups" :key="g" :value="g">{{ groupLabel(g) }}</option>
          </select>
        </label>
      </div>

      <div class="ob__cols" aria-hidden="true">
        <span>{{ t(data.price, { ticker: pair.quote }) }}</span>
        <span>{{ t(data.amount, { ticker: pair.base }) }}</span>
        <span>{{ t(data.total, { ticker: pair.base }) }}</span>
      </div>

      <ol class="ob__side">
        <li v-for="r in asks" :key="`a${r.price}`">
          <button type="button" class="ob__row is-ask" :style="{ '--depth': depth(r) }" :aria-label="t(data.pick, { price: price(r.price) })" @click="emit('pick', r.price)">
            <span class="is-down">{{ price(r.price) }}</span><span>{{ qty(r.amount) }}</span><span>{{ qty(r.total) }}</span>
          </button>
        </li>
      </ol>

      <div class="ob__mid" aria-live="off">
        <span class="ob__last num" :class="up ? 'is-up' : 'is-down'">
          {{ price(sim.last) }} <ZIcon name="arrow-up" :size="14" :class="{ 'is-flip': !up }" />
        </span>
        <span v-if="pair.quote === 'USDT'" class="ob__fiat num">≈ {{ fmt.money(sim.last * USDT_XOF) }}</span>
      </div>

      <ol class="ob__side">
        <li v-for="r in bids" :key="`b${r.price}`">
          <button type="button" class="ob__row is-bid" :style="{ '--depth': depth(r) }" :aria-label="t(data.pick, { price: price(r.price) })" @click="emit('pick', r.price)">
            <span class="is-up">{{ price(r.price) }}</span><span>{{ qty(r.amount) }}</span><span>{{ qty(r.total) }}</span>
          </button>
        </li>
      </ol>

      <div class="ob__ratio" :aria-label="`${data.ratio.label} : ${Math.round(sim.book.ratio * 100)} % / ${100 - Math.round(sim.book.ratio * 100)} %`" role="img">
        <span class="is-up num">{{ data.ratio.buy }} {{ Math.round(sim.book.ratio * 100) }}%</span>
        <span class="ob__ratio-bar"><i :style="{ width: `${sim.book.ratio * 100}%` }" /></span>
        <span class="is-down num">{{ 100 - Math.round(sim.book.ratio * 100) }}% {{ data.ratio.sell }}</span>
      </div>
    </template>

    <template v-else>
      <div class="ob__cols" aria-hidden="true">
        <span>{{ t(data.price, { ticker: pair.quote }) }}</span>
        <span>{{ t(data.amount, { ticker: pair.base }) }}</span>
        <span>{{ data.time }}</span>
      </div>
      <ol class="ob__trades">
        <li v-for="tr in sim.trades.slice(0, 26)" :key="tr.id" class="ob__trade num">
          <span :class="tr.side === 'buy' ? 'is-up' : 'is-down'">{{ price(tr.price) }}</span>
          <span>{{ qty(tr.amount) }}</span>
          <span class="ob__time">{{ time(tr.t) }}</span>
        </li>
      </ol>
    </template>
  </section>
</template>

<style scoped>
.ob { display: flex; flex-direction: column; min-width: 0; height: 100%; }
.ob__head { padding: 0 14px; border-bottom: 1px solid var(--color-line-default); }
.ob__tabs { border-bottom: 0; gap: 18px; }
.ob__tabs .z-tab { font-size: 13px; padding: 12px 0; }
.ob__tools { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px 4px; }
.ob__views { display: flex; gap: 4px; }
.ob__views button { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 4px; opacity: 0.45; transition: opacity var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.ob__views button[aria-pressed='true'] { opacity: 1; background: var(--fill-2); }
.ob__views svg { width: 15px; height: 15px; }
.ob__ico-ask { fill: var(--color-state-down); }
.ob__ico-bid { fill: var(--color-state-up); }
.ob__group select { height: 26px; padding: 0 6px; border-radius: 4px; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-default); font-size: 12px; }
.ob__cols, .ob__row, .ob__trade { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 8px; padding: 0 14px; font-size: 12px; }
.ob__cols { padding-block: 8px 6px; color: var(--color-text-dim); font-size: 11px; }
.ob__cols span:not(:first-child), .ob__row span:not(:first-child), .ob__trade span:not(:first-child) { text-align: right; }
.ob__row { position: relative; width: 100%; height: 22px; align-items: center; font-variant-numeric: tabular-nums; text-align: left; transition: background-color 120ms; }
.ob__row::before { content: ''; position: absolute; inset: 1px 0; right: 0; left: auto; width: var(--depth); transition: width 300ms var(--motion-ease-out); }
.ob__row.is-ask::before { background: color-mix(in srgb, var(--color-state-down) 12%, transparent); }
.ob__row.is-bid::before { background: color-mix(in srgb, var(--color-state-up) 12%, transparent); }
.ob__row span { position: relative; }
.ob__row:hover { background: var(--fill-1); }
.ob__mid { display: flex; align-items: baseline; gap: 10px; padding: 10px 14px; border-block: 1px solid var(--color-line-default); margin: 4px 0; }
.ob__last { display: inline-flex; align-items: center; gap: 4px; font-size: 18px; font-weight: var(--font-weight-semibold); }
.ob__last .is-flip { transform: rotate(180deg); }
.ob__fiat { font-size: 11px; color: var(--color-text-muted); }
.ob__ratio { display: flex; align-items: center; gap: 8px; margin-top: auto; padding: 12px 14px; font-size: 11px; }
.ob__ratio-bar { flex: 1; height: 4px; border-radius: 2px; background: var(--color-state-down); overflow: hidden; }
.ob__ratio-bar i { display: block; height: 100%; background: var(--color-state-up); transition: width 300ms var(--motion-ease-out); }
.ob__trades { overflow: hidden; }
.ob__trade { height: 22px; align-items: center; }
.ob__time { color: var(--color-text-muted); }
</style>
