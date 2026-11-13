<script setup>
import { computed, ref } from 'vue';
import { USD_XOF } from '../content/data.js';
import { priceDecimals, useI18n } from '../composables/useI18n.js';
import { useMarketFeed } from '../composables/useMarketFeed.js';
import { useProfile } from '../composables/useProfile.js';
import { useWallet } from '../composables/useWallet.js';
import { dailyPnl, demoTransactions, portfolioHistory } from '../market/wallet.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZCoinIcon from '../components/ui/ZCoinIcon.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZSelect from '../components/ui/ZSelect.vue';
import PnlBars from '../components/wallet/PnlBars.vue';
import PnlCalendar from '../components/wallet/PnlCalendar.vue';
import ValueChart from '../components/wallet/ValueChart.vue';

const { i18n, fmt, t } = useI18n();
const feed = useMarketFeed();
const { balances, demo } = useWallet();
const { prefs } = useProfile();
const data = computed(() => i18n.content.pages.wallet);
const links = computed(() => i18n.content.common.links);

// ---------- Montants : devise d'affichage et masquage ----------
const usd = computed(() => prefs.currency === 'USD');
const money = (xof) => (usd.value ? `${fmt.num(xof / USD_XOF, 2)} USD` : fmt.xof(xof));
const moneyShort = (xof) => (usd.value ? `${fmt.compact(xof / USD_XOF)} $` : `${fmt.compact(xof)} F`);
const other = (xof) => (usd.value ? fmt.xof(xof) : `${fmt.num(xof / USD_XOF, 2)} USD`);
const hide = (s) => (prefs.hideBalance ? '••••••' : s);

// ---------- Actifs ----------
const hideSmall = ref(false);
const assets = computed(() =>
  feed.coins
    .filter((c) => balances[c.id])
    .map((c) => ({ ...c, qty: balances[c.id], value: balances[c.id] * c.price }))
    .sort((a, b) => b.value - a.value),
);
const total = computed(() => assets.value.reduce((s, a) => s + a.value, 0));
const shownAssets = computed(() => (hideSmall.value ? assets.value.filter((a) => a.value >= 5000) : assets.value));
const qty = (a) => fmt.num(a.qty, 0, Math.min(8, Math.max(2, Math.ceil(Math.log10(a.price)) - 1)));

// ---------- P&L ----------
const history = portfolioHistory(total.value, 91);
const range = ref(30);
const slice = computed(() => history.slice(-range.value - 1));
const pnlDays = computed(() => dailyPnl(slice.value));
const allDays = dailyPnl(history);
const periodPnl = computed(() => slice.value.at(-1).v - slice.value[0].v);
const periodPct = computed(() => (slice.value.at(-1).v / slice.value[0].v - 1) * 100);
const today = allDays.at(-1);
const best = computed(() => pnlDays.value.reduce((a, b) => (b.v > a.v ? b : a)));
const worst = computed(() => pnlDays.value.reduce((a, b) => (b.v < a.v ? b : a)));
const chartTab = ref('value');
const signed = (v) => `${v >= 0 ? '+' : '−'}${money(Math.abs(v))}`;
const dateShort = (ts) => fmt.date(ts, { day: 'numeric', month: 'short' });

// ---------- Transactions ----------
const txs = demoTransactions(i18n.content.common.coins);
const status = ref('all');
const type = ref('all');
const query = ref('');
const limit = ref(10);
const openTx = ref(null);
const statuses = ['all', 'success', 'pending', 'cancelled', 'failed'];
const counts = computed(() => Object.fromEntries(statuses.map((s) => [s, s === 'all' ? txs.length : txs.filter((x) => x.status === s).length])));
const typeOptions = computed(() => [{ value: 'all', label: data.value.tx.allTypes }, ...Object.entries(data.value.tx.types).map(([value, label]) => ({ value, label }))]);
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return txs.filter(
    (x) =>
      (status.value === 'all' || x.status === status.value) &&
      (type.value === 'all' || x.type === type.value) &&
      (!q || x.id.toLowerCase().includes(q) || x.coin.includes(q)),
  );
});
const coinOf = (id) => feed.coins.find((c) => c.id === id);
const txIcons = { deposit: 'arrow-down', receive: 'receive', buy: 'plus', convert: 'swap', send: 'send', withdraw: 'withdraw', sell: 'minus', p2p: 'user' };
const statusIcons = { success: 'check', pending: 'clock', cancelled: 'close', failed: 'alert' };
const methodName = (id) => i18n.content.common.paymentMethods.find((m) => m.id === id)?.name;
const txAmount = (x) => {
  const c = coinOf(x.coin);
  const n = fmt.num(x.amount, 0, Math.min(8, Math.max(2, Math.ceil(Math.log10(c.price)) - 1)));
  return `${x.direction > 0 ? '+' : x.direction < 0 ? '−' : ''}${n} ${c.ticker}`;
};
const txDate = (ts) => fmt.date(ts, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
</script>

<template>
  <SiteLayout page="wallet" signed-in>
    <div class="container page wl">
      <header class="wl__head">
        <h1 class="title wl__title">{{ data.title }}</h1>
        <div class="wl__actions">
          <ZButton :href="links.receive"><ZIcon name="arrow-down" :size="14" /> {{ data.actions.deposit }}</ZButton>
          <ZButton variant="ghost" :href="links.withdraw"><ZIcon name="withdraw" :size="14" /> {{ data.actions.withdraw }}</ZButton>
          <ZButton variant="ghost" :href="links.send"><ZIcon name="send" :size="14" /> {{ data.actions.send }}</ZButton>
          <ZButton variant="ghost" :href="links.swap"><ZIcon name="swap" :size="14" /> {{ data.actions.convert }}</ZButton>
        </div>
      </header>

      <section class="wl__balance z-panel" :aria-label="data.balance.label">
        <div class="wl__bal-top">
          <span class="wl__bal-label">{{ data.balance.label }}</span>
          <button type="button" class="wl__eye" :aria-pressed="prefs.hideBalance" :aria-label="prefs.hideBalance ? data.balance.show : data.balance.hide" @click="prefs.hideBalance = !prefs.hideBalance">
            <ZIcon :name="prefs.hideBalance ? 'eye-off' : 'eye'" :size="16" />
          </button>
          <div class="z-seg wl__cur" role="group" :aria-label="data.balance.currency">
            <button v-for="c in ['XOF', 'USD']" :key="c" type="button" :aria-pressed="prefs.currency === c" @click="prefs.currency = c">{{ c }}</button>
          </div>
        </div>
        <p class="wl__total num">{{ hide(money(total)) }}</p>
        <p class="wl__sub num">≈ {{ hide(other(total)) }}</p>
        <p class="wl__today num">
          {{ data.balance.today }}
          <strong :class="today.v >= 0 ? 'is-up' : 'is-down'">{{ prefs.hideBalance ? '••••' : signed(today.v) }} ({{ fmt.pct(today.pct) }})</strong>
        </p>
        <p v-if="demo" class="wl__demo">{{ data.demo }}</p>
      </section>

      <section class="wl__pnl z-panel" aria-labelledby="wl-pnl-title">
        <div class="wl__pnl-head">
          <h2 id="wl-pnl-title">{{ data.pnl.title }}</h2>
          <div class="wl__ranges" role="group" :aria-label="data.pnl.range">
            <button v-for="r in [7, 30, 90]" :key="r" type="button" class="z-chip" :aria-pressed="range === r" @click="range = r">{{ t(data.pnl.days, { n: r }) }}</button>
          </div>
        </div>
        <dl class="wl__stats">
          <div>
            <dt>{{ t(data.pnl.period, { n: range }) }}</dt>
            <dd class="num" :class="periodPnl >= 0 ? 'is-up' : 'is-down'">{{ prefs.hideBalance ? '••••' : signed(periodPnl) }} <small>{{ fmt.pct(periodPct) }}</small></dd>
          </div>
          <div>
            <dt>{{ data.pnl.best }}</dt>
            <dd class="num is-up">{{ prefs.hideBalance ? '••••' : signed(best.v) }} <small>{{ dateShort(best.t) }}</small></dd>
          </div>
          <div>
            <dt>{{ data.pnl.worst }}</dt>
            <dd class="num is-down">{{ prefs.hideBalance ? '••••' : signed(worst.v) }} <small>{{ dateShort(worst.t) }}</small></dd>
          </div>
        </dl>
        <div class="z-tabs wl__ctabs" role="tablist">
          <button v-for="tb in ['value', 'daily', 'calendar']" :key="tb" type="button" role="tab" class="z-tab" :aria-selected="chartTab === tb" @click="chartTab = tb">{{ data.pnl.tabs[tb] }}</button>
        </div>
        <ValueChart
          v-if="chartTab === 'value'"
          :points="slice"
          :format-value="moneyShort"
          :format-date="dateShort"
          :hidden="prefs.hideBalance"
          :label="t(data.pnl.valueLabel, { n: range, from: hide(money(slice[0].v)), to: hide(money(slice.at(-1).v)) })"
        />
        <PnlBars
          v-else-if="chartTab === 'daily'"
          :days="pnlDays"
          :format-value="moneyShort"
          :format-date="dateShort"
          :format-pct="fmt.pct"
          :hidden="prefs.hideBalance"
          :label="t(data.pnl.dailyLabel, { n: range })"
        />
        <PnlCalendar
          v-else
          :days="allDays"
          :format-compact="moneyShort"
          :format-value="money"
          :month-label="(d) => fmt.date(d, { month: 'long', year: 'numeric' })"
          :weekdays="data.pnl.weekdays"
          :labels="data.pnl.calendar"
          :hidden="prefs.hideBalance"
        />
        <p class="wl__chart-hint">{{ data.pnl.hint }}</p>
      </section>

      <section class="wl__assets" aria-labelledby="wl-assets-title">
        <div class="wl__sec-head">
          <h2 id="wl-assets-title">{{ data.assets.title }}</h2>
          <label class="wl__toggle"><input v-model="hideSmall" type="checkbox" /> <span class="wl__switch" aria-hidden="true" /> {{ data.assets.hideSmall }}</label>
        </div>
        <table class="wl__table">
          <caption class="sr-only">{{ data.assets.title }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ data.assets.cols.coin }}</th>
              <th scope="col">{{ data.assets.cols.balance }}</th>
              <th scope="col">{{ data.assets.cols.value }}</th>
              <th scope="col" class="c-price">{{ data.assets.cols.price }}</th>
              <th scope="col" class="c-share">{{ data.assets.cols.share }}</th>
              <th scope="col" class="c-act"><span class="sr-only">{{ data.assets.cols.actions }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in shownAssets" :key="a.id">
              <th scope="row"><span class="wl__coin"><ZCoinIcon :glyph="a.glyph" :tone="a.tone" :size="28" /><span><strong>{{ a.ticker }}</strong><small>{{ a.name }}</small></span></span></th>
              <td class="num">{{ hide(qty(a)) }}</td>
              <td class="num">{{ hide(money(a.value)) }}</td>
              <td class="num c-price">{{ money(a.price) }} <small :class="a.change['24h'] >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(a.change['24h']) }}</small></td>
              <td class="c-share">
                <span class="wl__share"><i :style="{ width: `${(a.value / total) * 100}%` }" /></span>
                <span class="num">{{ fmt.num((a.value / total) * 100, 1) }} %</span>
              </td>
              <td class="c-act">
                <a :href="`${links.receive}?crypto=${a.id}`">{{ data.assets.deposit }}</a>
                <a :href="`${links.send}?crypto=${a.id}`">{{ data.assets.send }}</a>
                <a :href="`${links.swap}?from=${a.id}`">{{ data.assets.convert }}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wl__tx" aria-labelledby="wl-tx-title">
        <div class="wl__sec-head">
          <h2 id="wl-tx-title">{{ data.tx.title }}</h2>
        </div>
        <div class="wl__filters">
          <div class="wl__status" role="group" :aria-label="data.tx.statusLabel">
            <button v-for="s in statuses" :key="s" type="button" class="z-chip" :aria-pressed="status === s" @click="status = s; limit = 10">
              {{ data.tx.statuses[s] }} <span class="num">{{ counts[s] }}</span>
            </button>
          </div>
          <ZSelect v-model="type" :options="typeOptions" :label="data.tx.typeLabel" />
          <label class="wl__search">
            <ZIcon name="search" :size="15" />
            <span class="sr-only">{{ data.tx.search }}</span>
            <input v-model="query" type="search" :placeholder="data.tx.search" />
          </label>
        </div>

        <ul class="wl__txlist">
          <li v-for="x in filtered.slice(0, limit)" :key="x.id" class="tx" :class="{ 'is-open': openTx === x.id }">
            <button type="button" class="tx__row" :aria-expanded="openTx === x.id" :aria-controls="`tx-${x.id}`" @click="openTx = openTx === x.id ? null : x.id">
              <span class="tx__icon" :class="x.direction > 0 ? 'is-in' : x.direction < 0 ? 'is-out' : ''"><ZIcon :name="txIcons[x.type]" :size="16" /></span>
              <span class="tx__what">
                <strong>{{ t(data.tx.titles[x.type], { coin: coinOf(x.coin).ticker, to: x.to ? coinOf(x.to).ticker : '' }) }}</strong>
                <time class="num">{{ txDate(x.at) }}</time>
              </span>
              <span class="tx__amount num">
                <strong :class="{ 'is-up': x.direction > 0 && x.status === 'success' }">{{ hide(txAmount(x)) }}</strong>
                <small>≈ {{ hide(money(x.xof)) }}</small>
              </span>
              <span class="tx__status" :class="`is-${x.status}`"><ZIcon :name="statusIcons[x.status]" :size="13" /> {{ data.tx.statuses[x.status] }}</span>
              <ZIcon name="chevron" :size="16" class="tx__chev" />
            </button>
            <dl v-if="openTx === x.id" :id="`tx-${x.id}`" class="tx__details">
              <div><dt>{{ data.tx.details.id }}</dt><dd class="num">{{ x.id }}</dd></div>
              <div><dt>{{ data.tx.details.date }}</dt><dd class="num">{{ fmt.date(x.at, { dateStyle: 'long', timeStyle: 'short' }) }}</dd></div>
              <div v-if="x.network"><dt>{{ data.tx.details.network }}</dt><dd>{{ x.network }}</dd></div>
              <div v-if="x.method"><dt>{{ data.tx.details.method }}</dt><dd>{{ methodName(x.method) }}</dd></div>
              <div><dt>{{ data.tx.details.fee }}</dt><dd class="num">{{ x.fee ? `${fmt.num(x.fee, 0, 6)} ${coinOf(x.coin).ticker}` : data.tx.details.noFee }}</dd></div>
              <div><dt>{{ data.tx.details.status }}</dt><dd>{{ data.tx.reasons[x.status] }}</dd></div>
            </dl>
          </li>
        </ul>
        <p v-if="!filtered.length" class="wl__empty" role="status">{{ data.tx.empty }}</p>
        <button v-if="filtered.length > limit" type="button" class="wl__more" @click="limit += 10">{{ data.tx.more }}</button>
      </section>
    </div>
  </SiteLayout>
</template>

<style scoped>
.wl__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.wl__title { font-size: clamp(32px, 3.6vw, 48px); }
.wl__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.wl__balance { margin-top: 32px; padding: 28px; background: linear-gradient(120deg, color-mix(in srgb, var(--color-brand-primary) 20%, var(--color-bg-surface)), var(--color-bg-surface) 55%); }
.wl__bal-top { display: flex; align-items: center; gap: 10px; }
.wl__bal-label { font-size: 13px; color: var(--color-text-muted); }
.wl__eye { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--color-text-muted); }
.wl__eye:hover { color: var(--color-text-default); background: var(--fill-2); }
.wl__cur { margin-left: auto; padding: 3px; }
.wl__cur button { height: 28px; padding: 0 12px; font-size: 12px; }
.wl__total { margin-top: 12px; font-size: clamp(34px, 4vw, 52px); font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; line-height: 1.05; }
.wl__sub { margin-top: 6px; font-size: 14px; color: var(--color-text-muted); }
.wl__today { margin-top: 14px; font-size: 13px; color: var(--color-text-muted); }
.wl__today strong { margin-left: 6px; font-weight: var(--font-weight-semibold); }
.wl__demo { margin-top: 10px; font-size: 12px; color: var(--color-text-dim); }
.wl__pnl { margin-top: 20px; padding: 24px; }
.wl__pnl-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.wl__pnl-head h2, .wl__sec-head h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.wl__ranges { display: flex; gap: 6px; }
.wl__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0 8px; }
.wl__stats div { padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); }
.wl__stats dt { font-size: 12px; color: var(--color-text-muted); }
.wl__stats dd { margin: 6px 0 0; font-size: 17px; font-weight: var(--font-weight-semibold); }
.wl__stats small { display: block; margin-top: 2px; font-size: 12px; font-weight: var(--font-weight-regular); color: var(--color-text-muted); }
.wl__ctabs { margin-bottom: 18px; }
.wl__chart-hint { margin-top: 10px; font-size: 11.5px; color: var(--color-text-dim); }
.wl__assets, .wl__tx { margin-top: 48px; }
.wl__sec-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 16px; }
.wl__toggle { position: relative; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.wl__toggle input { position: absolute; opacity: 0; }
.wl__switch { position: relative; width: 34px; height: 20px; border-radius: var(--radius-pill); background: var(--color-line-strong); transition: background-color var(--motion-duration-hover); }
.wl__switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: var(--color-text-default); transition: transform var(--motion-duration-hover) var(--motion-ease-out); }
.wl__toggle input:checked + .wl__switch { background: var(--color-brand-primary); }
.wl__toggle input:checked + .wl__switch::after { transform: translateX(14px); }
.wl__toggle input:focus-visible + .wl__switch { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.wl__table { width: 100%; border-collapse: collapse; font-size: 14px; }
.wl__table thead th { height: 40px; padding: 0 12px; background: var(--color-bg-surface-2); font-size: 12px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); text-align: right; }
.wl__table thead th:first-child { text-align: left; border-radius: var(--radius-md) 0 0 var(--radius-md); }
.wl__table thead th:last-child { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
.wl__table td, .wl__table tbody th { height: 64px; padding: 0 12px; text-align: right; border-bottom: 1px solid var(--color-line-default); font-weight: var(--font-weight-medium); }
.wl__table tbody th { text-align: left; }
.wl__coin { display: inline-flex; align-items: center; gap: 12px; }
.wl__coin strong { display: block; }
.wl__coin small { display: block; font-size: 12px; font-weight: var(--font-weight-regular); color: var(--color-text-muted); }
.c-price small { display: block; font-size: 12px; }
.c-share { width: 160px; }
.c-share > span:last-child { font-size: 12px; color: var(--color-text-muted); }
.wl__share { display: block; height: 4px; margin-bottom: 6px; border-radius: 2px; background: var(--color-line-default); overflow: hidden; }
.wl__share i { display: block; height: 100%; border-radius: 2px; background: var(--color-brand-primary-300); }
.c-act a { margin-left: 14px; font-size: 13px; color: var(--color-brand-primary-300); }
.c-act a:hover { color: var(--color-text-default); }
.wl__filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; }
.wl__status { display: flex; flex-wrap: wrap; gap: 6px; margin-right: auto; }
.wl__status .num { margin-left: 4px; opacity: 0.6; }
.wl__search { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-muted); }
.wl__search:focus-within { border-color: var(--color-brand-secondary-300); }
.wl__search input { width: 160px; background: none; border: 0; outline: none; font-size: 13px; color: var(--color-text-default); }
.tx { border-bottom: 1px solid var(--color-line-default); }
.tx__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto 130px auto; align-items: center; gap: 16px; width: 100%; padding: 14px 8px; text-align: left; border-radius: var(--radius-sm); transition: background-color var(--motion-duration-hover); }
.tx__row:hover { background: var(--fill-1); }
.tx__icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--fill-2); color: var(--color-text-muted); }
.tx__icon.is-in { color: var(--color-state-up); }
.tx__icon.is-out { color: var(--color-brand-secondary-300); }
.tx__what strong { display: block; font-size: 14px; font-weight: var(--font-weight-medium); }
.tx__what time { font-size: 12px; color: var(--color-text-dim); }
.tx__amount { text-align: right; }
.tx__amount strong { display: block; font-size: 14px; font-weight: var(--font-weight-semibold); }
.tx__amount small { font-size: 12px; color: var(--color-text-muted); }
.tx__status { --tone: var(--color-text-muted); display: inline-flex; align-items: center; justify-self: start; gap: 6px; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 12px; color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent); }
.tx__status.is-success { --tone: var(--color-state-up); }
.tx__status.is-pending { --tone: var(--color-brand-secondary-300); }
.tx__status.is-cancelled { --tone: var(--color-text-muted); }
.tx__status.is-failed { --tone: var(--color-state-down); }
.tx__chev { color: var(--color-text-dim); transition: transform var(--duration-panel) var(--motion-ease-out); }
.tx.is-open .tx__chev { transform: rotate(180deg); }
.tx__details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 24px; margin: 0 0 14px 60px; padding: 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; }
.tx__details dt { font-size: 12px; color: var(--color-text-dim); }
.tx__details dd { margin: 4px 0 0; overflow-wrap: anywhere; }
.wl__empty { padding: 40px 0; text-align: center; color: var(--color-text-muted); }
.wl__more { display: block; margin: 20px auto 0; padding: 10px 20px; border-radius: var(--radius-pill); border: 1px solid var(--color-line-strong); font-size: 13px; }
.wl__more:hover { background: var(--fill-2); }
@media (max-width: 900px) {
  .wl__stats { grid-template-columns: 1fr; }
  .c-price, .c-share, .c-act { display: none; }
  .tx__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .tx__status { grid-column: 2; grid-row: 2; }
  .tx__chev { display: none; }
  .tx__details { grid-template-columns: 1fr 1fr; margin-left: 0; }
  .wl__search { flex: 1; }
  .wl__search input { width: 100%; }
}
</style>
