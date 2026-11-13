<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { toast } from '../../composables/useToast.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';

// Achat rapide en 3 étapes : formulaire → récapitulatif → reçu. Achat uniquement.
// DÉMO : le paiement est simulé (succès ou erreur au hasard) ; à brancher sur links.buyAction.
const props = defineProps({
  data: { type: Object, required: true }, // pages.buy.widget
  common: { type: Object, required: true },
});
const { fmt, t, i18n } = useI18n();
const feed = useMarketFeed();
const cfg = props.common.buy;

// ---------- Choix mémorisés (devise, crypto, moyen de paiement) ----------
const STORE = 'zurumi.buy';
const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORE)) ?? {}; } catch { return {}; }
})();
const urlCrypto = new URLSearchParams(window.location.search).get('crypto');
const pick = (list, id, fallback) => (list.some((x) => x.id === id) ? id : fallback);
const state = reactive({
  spend: pick(cfg.currencies, saved.spend, 'XOF'),
  crypto: pick(feed.coins, urlCrypto, pick(feed.coins, saved.crypto, 'usdt')),
  method: pick(cfg.methods, saved.method, 'wave'),
});
watch(state, (s) => {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* stockage indisponible */ }
});

// ---------- Calculs ----------
const amount = ref('');
const cur = computed(() => cfg.currencies.find((c) => c.id === state.spend));
const coin = computed(() => feed.coins.find((c) => c.id === state.crypto));
const method = computed(() => cfg.methods.find((m) => m.id === state.method));
const methodName = (m) => m.name ?? props.data.card;

const money = (v, c = cur.value) => `${fmt.num(v, c.decimals)} ${c.id}`;
const qtyDecimals = (price) => Math.min(8, Math.max(2, Math.ceil(Math.log10(price)) - 1));
const rate = computed(() => (cur.value.id === 'XOF' ? coin.value.price : coin.value.price / cfg.usdXof)); // prix d'1 crypto dans la devise
const rateText = (r = rate.value, c = cur.value) => `${fmt.num(r, r >= 100 ? c.decimals : Math.max(2, 6 - Math.ceil(Math.log10(r + 1e-9))))} ${c.id}`;

const value = computed(() => fmt.parse(amount.value));
const has = computed(() => amount.value.trim() !== '' && Number.isFinite(value.value));
const processing = computed(() => (has.value ? value.value * method.value.fee : 0));
const network = computed(() => (has.value ? (cur.value.id === 'XOF' ? Math.round(cfg.networkFeeUsd * cfg.usdXof) : cfg.networkFeeUsd) : 0));
const received = computed(() => Math.max(0, value.value - processing.value - network.value) / rate.value);
const receivedText = computed(() => (has.value ? fmt.num(received.value, qtyDecimals(coin.value.price)) : '0'));

const error = computed(() => {
  if (!amount.value.trim()) return '';
  if (!has.value || value.value <= 0) return props.data.errors.invalid;
  if (value.value < cur.value.min) return t(props.data.errors.min, { min: money(cur.value.min) });
  if (value.value > cur.value.max) return t(props.data.errors.max, { max: money(cur.value.max) });
  return '';
});
const valid = computed(() => has.value && !error.value);
const pct = (f) => `${fmt.num(f * 100, 1)} %`;

// ---------- Options des sélecteurs ----------
const currencyOptions = computed(() => cfg.currencies.map((c) => ({ value: c.id, label: c.id, glyph: c.glyph, tone: c.tone })));
const cryptoOptions = computed(() =>
  feed.coins.map((c) => ({ value: c.id, label: c.name, short: c.ticker, glyph: c.glyph, tone: c.tone, sub: c.ticker, keywords: c.ticker })),
);
const methodOptions = computed(() =>
  cfg.methods.map((m) => ({ value: m.id, label: methodName(m), logos: m.logos, sub: pct(m.fee) })),
);

// ---------- Étapes ----------
const step = ref('form');
const quote = ref(null); // devis figé au passage au récapitulatif
const status = ref('idle'); // idle | loading | done | failed | timeout | expired
const receipt = ref(null);
const heading = ref(null);
let timer = 0;

async function go(next) {
  step.value = next;
  await nextTick();
  heading.value?.focus();
}
function toSummary() {
  if (!valid.value) return;
  const c = cur.value;
  quote.value = {
    cur: c,
    coin: coin.value,
    method: method.value,
    spend: value.value,
    processing: processing.value,
    network: network.value,
    received: received.value,
    receivedText: `${receivedText.value} ${coin.value.ticker}`,
    rate: rate.value,
  };
  status.value = 'idle';
  go('summary');
}
function back() {
  clearTimeout(timer);
  status.value = 'idle';
  go('form');
}

function pay() {
  if (status.value === 'loading' || status.value === 'done') return;
  if (status.value === 'expired') return back(); // nouveau taux : retour au formulaire
  status.value = 'loading';
  clearTimeout(timer);
  timer = setTimeout(() => {
    const r = Math.random();
    const next = r < 0.22 ? 'failed' : r < 0.37 ? 'timeout' : r < 0.48 ? 'expired' : 'done';
    status.value = next;
    if (next !== 'done') return toast(props.data.outcomes[next].title, { tone: 'error' });
    toast(props.data.outcomes.success, { tone: 'success' });
    const q = quote.value;
    const now = new Date();
    receipt.value = {
      id: `ZRM-${now.getTime().toString(36).toUpperCase().slice(-9)}`,
      date: now.toLocaleString(i18n.locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      spend: money(q.spend, q.cur),
      receive: q.receivedText,
      payment: methodName(q.method),
      rate: `1 ${q.coin.ticker} ≈ ${rateText(q.rate, q.cur)}`,
      fees: money(q.processing + q.network, q.cur),
      total: money(q.spend, q.cur),
    };
    setTimeout(() => go('receipt'), 600);
  }, 1800);
}
function restart() {
  amount.value = '';
  receipt.value = null;
  quote.value = null;
  status.value = 'idle';
  go('form');
}
onBeforeUnmount(() => clearTimeout(timer));

const payLabel = computed(() => {
  const s = props.data.summary;
  return { loading: s.processing, done: s.done, expired: s.refresh, failed: s.retry, timeout: s.retry }[status.value] ?? s.confirm;
});
const failure = computed(() => props.data.outcomes[status.value]?.title && status.value !== 'success' ? props.data.outcomes[status.value] : null);

// ---------- Reçu imprimable (PDF via la boîte d'impression du navigateur) ----------
function downloadReceipt() {
  const r = receipt.value;
  const w = window.open('', '_blank');
  if (!w) return toast(props.data.receipt.popup, { tone: 'error' });
  const css = getComputedStyle(document.documentElement);
  const brand = css.getPropertyValue('--color-brand-primary').trim();
  const up = css.getPropertyValue('--color-state-up').trim();
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const L = props.data.receipt;
  const row = (k, v, strong) => `<tr><td>${esc(k)}</td><td${strong ? ' class="b"' : ''}>${esc(v)}</td></tr>`;
  w.document.write(
    `<!doctype html><html lang="${i18n.locale}"><head><meta charset="utf-8"><title>${esc(r.id)}</title><style>` +
      `@page{margin:22mm}body{font-family:Inter,system-ui,Arial,sans-serif;color:#14121a;margin:0;padding:40px;max-width:520px}` +
      `img{height:44px}.ok{display:inline-block;margin-top:22px;padding:5px 12px;border-radius:999px;background:color-mix(in srgb,${up} 14%,transparent);color:${up};font-size:12px;font-weight:700}` +
      `h1{font-size:19px;margin:12px 0 2px}.sub{color:#6b6b72;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;border-top:1px solid #ececf0}` +
      `td{padding:11px 0;font-size:13px;border-bottom:1px solid #ececf0;color:#6b6b72}td+td{text-align:right;font-weight:600;color:#14121a}td.b{font-weight:800;color:${brand}}` +
      `.foot{margin-top:24px;color:#a0a0a6;font-size:11px}</style></head><body>` +
      `<div style="background:#050507;display:inline-block;padding:10px 14px;border-radius:10px"><img src="${location.origin}/images/brand/zurumi-logo.webp" alt="Zurumi"></div>` +
      `<div><span class="ok">${esc(L.title)}</span></div><h1>${esc(L.docTitle)}</h1><div class="sub">${esc(r.receive)}</div><table>` +
      row(L.ref, r.id) + row(L.date, r.date) + row(L.spent, r.spend) + row(L.got, r.receive) + row(L.payment, r.payment) + row(L.rate, r.rate) + row(L.fees, r.fees) + row(L.total, r.total, true) +
      `</table><div class="foot">${esc(L.footer)}</div></body></html>`,
  );
  w.document.close();
  w.focus();
  const print = () => setTimeout(() => w.print(), 250);
  w.document.readyState === 'complete' ? print() : w.addEventListener('load', print);
}
</script>

<template>
  <div class="bw z-panel" role="group" :aria-label="data.label">
    <!-- 1. Formulaire -->
    <form v-if="step === 'form'" class="bw__form" novalidate @submit.prevent="toSummary">
      <h2 ref="heading" class="sr-only" tabindex="-1">{{ data.label }}</h2>
      <div class="bw__field" :class="{ 'is-invalid': error }">
        <div class="bw__main">
          <label class="bw__label" for="bw-amount">{{ data.spend }}</label>
          <input
            id="bw-amount"
            v-model="amount"
            class="bw__amount num"
            inputmode="decimal"
            autocomplete="off"
            :placeholder="t(data.range, { min: fmt.num(cur.min, 0), max: fmt.num(cur.max, 0) })"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'bw-error' : undefined"
          />
        </div>
        <ZSelect v-model="state.spend" class="bw__unit" :options="currencyOptions" :label="data.currency" align="right" />
      </div>

      <div class="bw__field">
        <div class="bw__main">
          <span id="bw-receive" class="bw__label">{{ data.receive }}</span>
          <output class="bw__amount bw__out num" :class="{ 'is-empty': !has }" aria-labelledby="bw-receive" aria-live="polite">{{ receivedText }}</output>
        </div>
        <ZSelect v-model="state.crypto" class="bw__unit" :options="cryptoOptions" :label="data.crypto" searchable :search-label="data.cryptoSearch" :empty="data.empty" align="right" />
      </div>
      <p v-if="error" id="bw-error" class="bw__error" role="alert">{{ error }}</p>

      <div class="bw__pay">
        <span class="bw__pay-label">{{ data.payWith }}</span>
        <ZSelect v-model="state.method" variant="field" :options="methodOptions" :label="data.payWith" />
      </div>

      <dl v-if="valid" class="bw__fees">
        <div><dt>{{ data.fees.amount }}</dt><dd class="num">{{ money(value) }}</dd></div>
        <div><dt>{{ t(data.fees.processing, { pct: pct(method.fee) }) }}</dt><dd class="num">{{ money(processing) }}</dd></div>
        <div><dt>{{ data.fees.network }}</dt><dd class="num">{{ money(network) }}</dd></div>
        <div class="is-total"><dt>{{ data.fees.total }}</dt><dd class="num">{{ money(processing + network) }}</dd></div>
      </dl>

      <p class="bw__ref num">{{ t(data.reference, { crypto: coin.ticker, rate: rateText() }) }}</p>
      <ZButton type="submit" size="lg" class="bw__cta" :disabled="!valid">{{ t(data.cta, { crypto: coin.ticker }) }}</ZButton>
      <p class="bw__demo">{{ data.demo }}</p>
    </form>

    <!-- 2. Récapitulatif -->
    <div v-else-if="step === 'summary'" class="bw__step">
      <div class="bw__head">
        <button type="button" class="bw__back" :aria-label="data.summary.back" :title="data.summary.back" @click="back"><ZIcon name="arrow-left" :size="16" /></button>
        <h2 ref="heading" tabindex="-1">{{ data.summary.title }}</h2>
      </div>
      <dl class="bw__rows">
        <div><dt>{{ data.summary.spend }}</dt><dd class="num">{{ money(quote.spend, quote.cur) }}</dd></div>
        <div><dt>{{ data.summary.receive }}</dt><dd class="num">{{ quote.receivedText }}</dd></div>
        <div><dt>{{ data.summary.method }}</dt><dd>{{ methodName(quote.method) }}</dd></div>
        <div><dt>{{ data.summary.rate }}</dt><dd class="num">1 {{ quote.coin.ticker }} ≈ {{ rateText(quote.rate, quote.cur) }}</dd></div>
      </dl>
      <dl class="bw__fees">
        <div><dt>{{ t(data.fees.processing, { pct: pct(quote.method.fee) }) }}</dt><dd class="num">{{ money(quote.processing, quote.cur) }}</dd></div>
        <div><dt>{{ data.fees.network }}</dt><dd class="num">{{ money(quote.network, quote.cur) }}</dd></div>
        <div class="is-total"><dt>{{ data.summary.total }}</dt><dd class="num">{{ money(quote.spend, quote.cur) }}</dd></div>
      </dl>
      <div v-if="failure" class="bw__alert" role="alert">
        <ZIcon name="alert" :size="18" />
        <div><strong>{{ failure.title }}</strong><p>{{ failure.text }}</p></div>
      </div>
      <ZButton size="lg" class="bw__cta" :disabled="status === 'loading' || status === 'done'" @click="pay">
        <span v-if="status === 'loading'" class="bw__spinner" aria-hidden="true" />
        <ZIcon v-else-if="status === 'done'" name="check" :size="16" />
        {{ payLabel }}
      </ZButton>
      <p class="bw__demo">{{ data.demo }}</p>
    </div>

    <!-- 3. Reçu -->
    <div v-else class="bw__step">
      <div class="bw__ok">
        <span class="bw__ok-icon" aria-hidden="true"><ZIcon name="check" :size="26" /></span>
        <h2 ref="heading" tabindex="-1">{{ data.receipt.title }}</h2>
        <p>{{ t(data.receipt.received, { amount: receipt.receive }) }}</p>
      </div>
      <dl class="bw__rows">
        <div><dt>{{ data.receipt.ref }}</dt><dd class="num">{{ receipt.id }}</dd></div>
        <div><dt>{{ data.receipt.date }}</dt><dd>{{ receipt.date }}</dd></div>
        <div><dt>{{ data.receipt.spent }}</dt><dd class="num">{{ receipt.spend }}</dd></div>
        <div><dt>{{ data.receipt.got }}</dt><dd class="num">{{ receipt.receive }}</dd></div>
        <div><dt>{{ data.receipt.payment }}</dt><dd>{{ receipt.payment }}</dd></div>
        <div><dt>{{ data.receipt.fees }}</dt><dd class="num">{{ receipt.fees }}</dd></div>
        <div class="is-total"><dt>{{ data.receipt.total }}</dt><dd class="num">{{ receipt.total }}</dd></div>
      </dl>
      <div class="bw__actions">
        <ZButton variant="ghost" size="lg" @click="downloadReceipt"><ZIcon name="download" :size="16" /> {{ data.receipt.download }}</ZButton>
        <ZButton size="lg" @click="restart">{{ data.receipt.again }}</ZButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bw { width: 100%; max-width: 520px; padding: 26px 26px 22px; }
.bw__form, .bw__step { display: grid; gap: 14px; }
.bw__field {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-lg);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover);
}
.bw__field:focus-within { border-color: var(--color-brand-secondary-300); }
.bw__field.is-invalid { border-color: var(--color-state-down); }
.bw__main { flex: 1; min-width: 0; display: grid; gap: 6px; }
.bw__label { font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); }
.bw__amount { width: 100%; min-width: 0; padding: 0; background: none; border: 0; outline: none; font: inherit; font-size: 24px; font-weight: var(--font-weight-semibold); letter-spacing: -0.01em; color: var(--color-text-default); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bw__amount::placeholder, .bw__out.is-empty { color: var(--color-text-dim); }
.bw__unit { flex: none; }
.bw__error { margin-top: -6px; font-size: 13px; color: var(--color-state-down); }
.bw__pay { display: grid; gap: 8px; margin-top: 8px; }
.bw__pay-label { font-size: 14px; font-weight: var(--font-weight-semibold); }
.bw__fees, .bw__rows { display: grid; margin: 0; padding: 6px 16px; border-radius: var(--radius-lg); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.bw__fees div, .bw__rows div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; font-size: 13.5px; }
.bw__rows div { padding: 12px 0; border-bottom: 1px solid var(--color-line-default); }
.bw__rows div:last-child { border-bottom: 0; }
.bw__fees dt, .bw__rows dt { color: var(--color-text-muted); }
.bw__fees dd, .bw__rows dd { margin: 0; text-align: right; font-weight: var(--font-weight-medium); }
.bw__fees .is-total { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--color-line-default); }
.bw__fees .is-total dt, .bw__rows .is-total dt { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.is-total dd { font-weight: var(--font-weight-bold) !important; }
.bw__ref { font-size: 12.5px; color: var(--color-text-dim); }
.bw__cta { width: 100%; height: 52px; gap: 10px; }
.bw__cta:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.bw__demo { font-size: 11.5px; color: var(--color-text-dim); text-align: center; }
.bw__head { display: flex; align-items: center; gap: 12px; }
.bw__head h2, .bw__ok h2 { font-size: 18px; font-weight: var(--font-weight-semibold); }
.bw__head h2:focus, .bw__ok h2:focus, .bw__form h2:focus { outline: none; }
.bw__back { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-muted); }
.bw__back:hover { color: var(--color-text-default); border-color: var(--color-line-strong); }
.bw__alert { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-state-down) 9%, transparent); border: 1px solid color-mix(in srgb, var(--color-state-down) 38%, transparent); color: var(--color-state-down); }
.bw__alert :deep(svg) { flex: none; margin-top: 1px; }
.bw__alert strong { font-size: 14px; }
.bw__alert p { margin-top: 3px; font-size: 13px; color: var(--color-text-muted); }
.bw__spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid color-mix(in srgb, var(--color-text-default) 35%, transparent); border-top-color: var(--color-text-default); animation: bw-spin 0.7s linear infinite; }
@keyframes bw-spin { to { transform: rotate(360deg); } }
.bw__ok { display: grid; justify-items: center; gap: 6px; padding: 6px 0 8px; text-align: center; }
.bw__ok p { font-size: 14px; color: var(--color-text-muted); }
.bw__ok-icon { display: grid; place-items: center; width: 60px; height: 60px; margin-bottom: 8px; border-radius: 50%; color: var(--color-state-up); background: color-mix(in srgb, var(--color-state-up) 14%, transparent); border: 1px solid color-mix(in srgb, var(--color-state-up) 45%, transparent); }
.bw__actions { display: grid; gap: 10px; margin-top: 6px; }
.bw__actions :deep(.z-btn) { width: 100%; height: 50px; gap: 8px; }
@media (max-width: 520px) {
  .bw { padding: 20px 16px 18px; }
  .bw__amount { font-size: 21px; }
}
</style>
