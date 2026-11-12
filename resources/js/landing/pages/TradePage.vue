<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { pairs, USDT_XOF } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import { useMarketFeed } from '../composables/useMarketFeed.js';
import { useSession } from '../composables/useSession.js';
import { createPairSim } from '../market/pairSimulator.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import OrderBook from '../components/trade/OrderBook.vue';
import OrderForm from '../components/trade/OrderForm.vue';
import OrdersPanel from '../components/trade/OrdersPanel.vue';
import PairHeader from '../components/trade/PairHeader.vue';
import TickerStrip from '../components/trade/TickerStrip.vue';
import TradeChart from '../components/trade/TradeChart.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';

const { i18n, fmt, t } = useI18n();
const { user } = useSession();
const feed = useMarketFeed();
const data = computed(() => i18n.content.pages.trade);
const common = computed(() => i18n.content.common);

// ---------- Paire sélectionnée (?pair=BTC-USDT) ----------
const fromUrl = new URLSearchParams(window.location.search).get('pair')?.toUpperCase();
const pairId = ref(pairs.some((p) => p.id === fromUrl) ? fromUrl : 'BTC-USDT');
const pair = computed(() => pairs.find((p) => p.id === pairId.value));
const coin = computed(() => feed.coins.find((c) => c.id === pair.value.coin));

const pairOptions = computed(() =>
  pairs.map((p) => {
    const c = feed.coins.find((x) => x.id === p.coin);
    const change = c.change['24h'];
    return {
      value: p.id,
      label: `${p.base}/${p.quote}`,
      glyph: c.glyph,
      tone: c.tone,
      sub: fmt.pct(change),
      subClass: change >= 0 ? 'is-up' : 'is-down',
      keywords: c.name,
    };
  }),
);

// ---------- Simulateur de la paire (DÉMO) ----------
const sim = shallowRef(null);
function makeSim() {
  sim.value?.stop();
  const c = coin.value;
  const inXof = pair.value.quote === 'XOF';
  sim.value = createPairSim({
    pair: pair.value,
    price: inXof ? c.price : c.price / USDT_XOF,
    change24h: c.change['24h'],
    volumeQuote: inXof ? c.volume : c.volume / USDT_XOF,
    stable: c.category === 'stable',
  });
  sim.value.setTimeframe(timeframe.value);
  if (!document.hidden) sim.value.start();
}
const s = computed(() => sim.value.state);

const timeframe = ref('15m');
watch(timeframe, (tf) => sim.value.setTimeframe(tf));

watch(pairId, (id) => {
  makeSim();
  const url = new URL(window.location.href);
  url.searchParams.set('pair', id);
  window.history.replaceState(null, '', url);
});

const onVisibility = () => (document.hidden ? sim.value.stop() : sim.value.start());
makeSim();
onMounted(() => document.addEventListener('visibilitychange', onVisibility));
onBeforeUnmount(() => {
  sim.value.stop();
  document.removeEventListener('visibilitychange', onVisibility);
});

// ---------- Graphique ----------
const chartTab = ref('chart');
const hovered = ref(null);
const shown = computed(() => hovered.value ?? s.value.candles[s.value.candles.length - 1]);
const formatPrice = (v) => fmt.num(v, s.value.decimals);
const formatTime = (ts) =>
  ['15m', '1h', '4h'].includes(timeframe.value) ? fmt.date(ts, { hour: '2-digit', minute: '2-digit' }) : fmt.date(ts, { day: '2-digit', month: 'short' });
const tfLabel = computed(() => data.value.chart.timeframes.find((x) => x.id === timeframe.value)?.label);

// Un clic dans le carnet renseigne le prix de l'ordre.
const form = ref(null);
const pickPrice = (p) => form.value?.setPrice(p);
</script>

<template>
  <SiteLayout page="trade" :footer="false" solid-nav>
    <h1 class="sr-only">{{ data.meta.title }}</h1>
    <div class="trade">
      <PairHeader v-model="pairId" class="trade__head" :sim="s" :pair="pair" :coin="coin" :options="pairOptions" :data="data" />
      <TickerStrip class="trade__strip" :coins="feed.coins" :pairs="pairs" :links="common.links" :label="data.strip" />

      <section class="trade__chart panel" :aria-label="data.chart.tabs.chart">
        <div class="chart__bar">
          <div class="z-tabs chart__tabs" role="tablist">
            <button v-for="id in ['chart', 'info']" :key="id" type="button" role="tab" class="z-tab" :aria-selected="chartTab === id" @click="chartTab = id">
              {{ data.chart.tabs[id] }}
            </button>
          </div>
          <div v-if="chartTab === 'chart'" class="chart__tf" role="group" :aria-label="data.chart.timeframeLabel">
            <button v-for="tf in data.chart.timeframes" :key="tf.id" type="button" :aria-pressed="timeframe === tf.id" @click="timeframe = tf.id">
              {{ tf.label }}
            </button>
          </div>
        </div>

        <template v-if="chartTab === 'chart'">
          <p class="chart__ohlc num" aria-hidden="true">
            <span class="chart__pair">{{ pair.base }}/{{ pair.quote }} · {{ tfLabel }}</span>
            <span>{{ data.chart.ohlc.o }} <b :class="shown.c >= shown.o ? 'is-up' : 'is-down'">{{ formatPrice(shown.o) }}</b></span>
            <span>{{ data.chart.ohlc.h }} <b :class="shown.c >= shown.o ? 'is-up' : 'is-down'">{{ formatPrice(shown.h) }}</b></span>
            <span>{{ data.chart.ohlc.l }} <b :class="shown.c >= shown.o ? 'is-up' : 'is-down'">{{ formatPrice(shown.l) }}</b></span>
            <span>{{ data.chart.ohlc.c }} <b :class="shown.c >= shown.o ? 'is-up' : 'is-down'">{{ formatPrice(shown.c) }}</b></span>
            <span class="chart__ma"><i class="ma7" /> MA 7 <i class="ma25" /> MA 25</span>
          </p>
          <div class="chart__canvas">
            <TradeChart
              :candles="s.candles"
              :version="s.seq"
              :format-price="formatPrice"
              :format-time="formatTime"
              :label="t(data.chart.label, { pair: `${pair.base}/${pair.quote}`, tf: tfLabel })"
              @hover="hovered = $event"
            />
          </div>
        </template>

        <dl v-else class="chart__info">
          <div><dt>{{ data.chart.info.name }}</dt><dd>{{ coin.name }}</dd></div>
          <div><dt>{{ data.chart.info.symbol }}</dt><dd>{{ coin.ticker }}</dd></div>
          <div><dt>{{ data.chart.info.category }}</dt><dd>{{ common.categories[coin.category] }}</dd></div>
          <div><dt>{{ data.chart.info.price }}</dt><dd class="num">{{ fmt.xof(coin.price) }}</dd></div>
          <div><dt>{{ data.chart.info.cap }}</dt><dd class="num">{{ fmt.compact(coin.cap) }}</dd></div>
          <div><dt>{{ data.chart.info.volume }}</dt><dd class="num">{{ fmt.compact(coin.volume) }}</dd></div>
        </dl>
      </section>

      <OrderBook class="trade__book panel" :sim="s" :pair="pair" :data="data.book" @pick="pickPrice" @group="sim.setGroup($event)" />
      <OrderForm ref="form" class="trade__form panel" :sim="s" :pair="pair" :data="data.form" :links="common.links" :user="user" />
      <OrdersPanel class="trade__orders panel" :data="data.orders" :links="common.links" :user="user" />

      <section class="trade__accounts panel" :aria-labelledby="'acc-title'">
        <h2 id="acc-title" class="acc__title">{{ data.accounts.title }}</h2>
        <p class="acc__label">{{ data.accounts.trading }}</p>
        <dl class="acc__list">
          <div><dt>{{ pair.base }}</dt><dd class="num">—</dd></div>
          <div><dt>{{ pair.quote }}</dt><dd class="num">—</dd></div>
        </dl>
        <div class="acc__actions">
          <ZButton variant="ghost" :href="common.links.deposit">{{ data.accounts.deposit }}</ZButton>
          <ZButton variant="ghost" :href="common.links.send"><ZIcon name="transfer" :size="14" /> {{ data.accounts.transfer }}</ZButton>
        </div>
        <p class="acc__note">{{ data.note }}</p>
      </section>
    </div>
  </SiteLayout>
</template>

<style scoped>
.trade {
  display: grid; gap: 1px; padding-top: var(--space-nav-height); min-height: 100svh; background: var(--color-line-default);
  grid-template-columns: minmax(0, 1fr) 320px 320px;
  grid-template-rows: auto auto minmax(560px, auto) auto;
  grid-template-areas:
    'head head head'
    'strip strip strip'
    'chart book form'
    'orders orders accounts';
}
.panel, .trade__head { background: var(--color-bg-base); }
.trade__head { grid-area: head; }
.trade__strip { grid-area: strip; }
.trade__chart { grid-area: chart; display: flex; flex-direction: column; min-width: 0; }
.trade__book { grid-area: book; }
.trade__form { grid-area: form; }
.trade__orders { grid-area: orders; }
.trade__accounts { grid-area: accounts; }

.chart__bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 0 16px; border-bottom: 1px solid var(--color-line-default); }
.chart__tabs { border-bottom: 0; gap: 18px; }
.chart__tabs .z-tab { font-size: 13px; }
.chart__tf { display: flex; gap: 2px; }
.chart__tf button { padding: 4px 8px; border-radius: 4px; font-size: 12px; color: var(--color-text-muted); }
.chart__tf button:hover { color: var(--color-text-default); }
.chart__tf button[aria-pressed='true'] { color: var(--color-brand-primary-300); background: var(--fill-1); }
.chart__ohlc { display: flex; flex-wrap: wrap; gap: 4px 14px; padding: 10px 16px 0; font-size: 11.5px; color: var(--color-text-muted); }
.chart__ohlc b { font-weight: var(--font-weight-medium); }
.chart__pair { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.chart__ma { display: inline-flex; align-items: center; gap: 6px; }
.chart__ma i { display: inline-block; width: 12px; height: 2px; border-radius: 1px; }
.chart__ma .ma7 { background: var(--color-brand-primary-300); }
.chart__ma .ma25 { background: var(--color-brand-secondary-300); margin-left: 6px; }
.chart__canvas { flex: 1; min-height: 420px; padding: 8px 0 0 8px; }
.chart__info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 16px; background: var(--color-line-default); border-radius: var(--radius-md); overflow: hidden; }
.chart__info div { padding: 16px; background: var(--color-bg-base); }
.chart__info dt { font-size: var(--font-size-small); color: var(--color-text-dim); }
.chart__info dd { margin: 6px 0 0; font-size: 15px; font-weight: var(--font-weight-medium); }

.trade__accounts { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.acc__title { font-size: 14px; font-weight: var(--font-weight-semibold); }
.acc__label { font-size: var(--font-size-small); color: var(--color-text-muted); }
.acc__list { display: grid; gap: 8px; margin: 0; font-size: 13px; }
.acc__list div { display: flex; justify-content: space-between; }
.acc__list dd { margin: 0; color: var(--color-text-muted); }
.acc__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: auto; }
.acc__note { font-size: 11px; color: var(--color-text-dim); }

@media (max-width: 1240px) {
  .trade {
    grid-template-columns: minmax(0, 1fr) 320px;
    grid-template-rows: auto auto 520px auto auto;
    grid-template-areas:
      'head head'
      'strip strip'
      'chart form'
      'book orders'
      'book accounts';
  }
  .trade__chart .chart__canvas { min-height: 0; }
}
@media (max-width: 760px) {
  .trade {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas: 'head' 'strip' 'chart' 'form' 'book' 'orders' 'accounts';
  }
  .trade__chart { height: 440px; }
  .chart__bar { flex-wrap: wrap; padding: 0 var(--space-gutter-mobile) 8px; }
  .chart__ma { display: none; }
}
</style>
