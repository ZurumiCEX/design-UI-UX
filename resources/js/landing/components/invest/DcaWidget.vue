<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { toast } from '../../composables/useToast.js';
import { dca as CFG } from '../../content/data.js';
import ZButton from '../ui/ZButton.vue';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZDialog from '../ui/ZDialog.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';

// Investissement programmé (DCA). Adapté du widget « Zurumi · Widget DCA » v1.0.
// Production : GET /api/v1/dca/config · POST /quote · POST /plans (Idempotency-Key) · GET /plans ·
//   PATCH /plans/{id} · DELETE /plans/{id} · GET /plans/{id}/executions.
//   Allocations en points de base (somme 10 000), montants en XOF entiers, quantités en chaînes décimales.
// DÉMO : `api` simulé, plans conservés dans localStorage, prix du flux de marché, simulation sur série fictive.
const props = defineProps({ data: { type: Object, required: true } }); // pages.dca
const { fmt, t, i18n } = useI18n();
const feed = useMarketFeed();
const KEY = 'zurumi.dca.plans';

const coin = (id) => feed.coins.find((c) => c.id === id);
const A = (id) => CFG.assets.find((a) => a.id === id);
const xof = (n) => fmt.xof(Math.round(n));
const qty = (n, id) => `${fmt.num(n, 0, A(id).dec)} ${coin(id).ticker}`;
const int0 = (v) => parseInt(String(v).replace(/\D/g, ''), 10) || 0;
const freqOf = (id) => CFG.frequencies.find((f) => f.id === id);

// ---------- État ----------
const state = reactive({
  mode: 'single', asset: 'usdt', alloc: [{ id: 'btc', pct: 50 }, { id: 'eth', pct: 30 }, { id: 'sol', pct: 20 }],
  amount: 10000, freq: 'weekly', day: 0, monthDay: 1, hour: 9, source: 'wallet', endMode: 'never', endValue: '', cap: false, capValue: '', editingId: null,
});
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const plans = ref(load());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(plans.value)); } catch { /* indisponible */ } };
const tab = ref('new');
const amountText = computed({
  get: () => (state.amount ? fmt.num(state.amount) : ''),
  set: (v) => { state.amount = int0(v); },
});

// ---------- Adaptateur API (simulé) ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const api = {
  async createPlan(payload) {
    const key = crypto.randomUUID?.() ?? String(Date.now()); // Idempotency-Key
    await wait(450);
    return { ...payload, id: `dca_${key.slice(0, 8)}`, status: 'active', created_at: new Date().toISOString(), executions: 0, invested: 0, holdings: {} };
  },
  async updatePlan() { await wait(200); },
  async deletePlan() { await wait(200); },
};

// ---------- Calculs ----------
const allocOf = (s) => (s.mode === 'single' ? [{ id: s.asset, pct: 100 }] : s.alloc);
// Découpe d'un montant entier selon les % (plus fort reste : la somme des parts = le montant exact).
function legs(amount, al) {
  const raw = al.map((x) => (amount * x.pct) / 100), base = raw.map(Math.floor);
  let rest = amount - base.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { base[i]++; rest--; } });
  return al.map((x, i) => ({ ...x, xof: base[i], fee: Math.round(base[i] * CFG.feeRate) }));
}
function equalize() {
  const n = state.alloc.length, b = Math.floor(100 / n);
  state.alloc.forEach((x, i) => { x.pct = b + (i < 100 - b * n ? 1 : 0); });
}
const basket = computed(() => state.mode === 'basket');
const al = computed(() => allocOf(state));
const L = computed(() => legs(state.amount, al.value));
const sum = computed(() => al.value.reduce((s, x) => s + x.pct, 0));
const fee = computed(() => L.value.reduce((s, l) => s + l.fee, 0));
const monthly = computed(() => state.amount * freqOf(state.freq).perMonth);
const used = computed(() => plans.value.filter((p) => p.status === 'active' && p.id !== state.editingId).reduce((s, p) => s + p.amount * freqOf(p.freq).perMonth, 0));
const errs = computed(() => {
  const e = props.data.errors, a = state.amount, out = {};
  if (a < CFG.minAmount) out.amount = t(e.min, { v: xof(CFG.minAmount) });
  else if (a > CFG.maxAmount) out.amount = t(e.max, { v: xof(CFG.maxAmount) });
  if (basket.value) {
    if (L.value.length < 2) out.alloc = e.two;
    else if (sum.value !== 100) out.alloc = t(e.sum, { n: sum.value });
    else if (L.value.some((l) => l.pct === 0)) out.alloc = e.zero;
    else if (!out.amount && L.value.some((l) => l.xof < CFG.minLeg)) out.alloc = t(e.leg, { v: xof(CFG.minLeg) });
  }
  if (monthly.value + used.value > CFG.kycMonthlyLimit) out.kyc = e.kyc;
  if (state.endMode === 'count' && int0(state.endValue) < 2) out.end = e.count;
  if (state.endMode === 'budget' && int0(state.endValue) < a * 2) out.end = t(e.budget, { v: xof(a * 2) });
  if (!basket.value && state.cap && int0(state.capValue) <= 0) out.cap = e.cap;
  return out;
});
const firstErr = computed(() => { const e = errs.value; return e.amount || e.alloc || e.kyc || e.end || e.cap || ''; });

// Prochaine exécution (Dakar = GMT, pas d'heure d'été).
function nextRun(p, from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), p.hour, 0, 0));
  if (p.freq === 'daily') { if (d <= from) d.setUTCDate(d.getUTCDate() + 1); return d; }
  if (p.freq === 'weekly' || p.freq === 'biweekly') {
    d.setUTCDate(d.getUTCDate() + (((p.day + 1) % 7) - d.getUTCDay() + 7) % 7);
    if (d <= from) d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }
  d.setUTCDate(p.monthDay);
  if (d <= from) d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}
const locale = computed(() => (i18n.locale === 'fr' ? 'fr-FR' : 'en-GB'));
const fmtDate = (d) => d.toLocaleString(locale.value, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
function freqText(p) {
  const f = props.data.freqText, day = props.data.weekdays[p.day].toLowerCase(), h = String(p.hour).padStart(2, '0');
  return t(f[p.freq], { day, h, d: p.monthDay });
}
const sub = computed(() => {
  let s = freqText(state);
  if (state.endMode === 'count' && int0(state.endValue)) s += ` · ${t(props.data.summary.buys, { n: int0(state.endValue) })}`;
  if (state.endMode === 'budget' && int0(state.endValue)) s += ` · ${t(props.data.summary.aboutBuys, { n: Math.floor(int0(state.endValue) / Math.max(1, state.amount)) })}`;
  return s;
});

// ---------- Actions du formulaire ----------
function toggleAsset(id) {
  if (!basket.value) { state.asset = id; state.capValue = ''; return; }
  const i = state.alloc.findIndex((x) => x.id === id);
  if (i >= 0) state.alloc.splice(i, 1);
  else if (state.alloc.length >= CFG.maxAssets) return toast(t(props.data.basket.max, { n: CFG.maxAssets }));
  else state.alloc.push({ id, pct: 0 });
  if (state.alloc.length) equalize();
}
const presetOn = (b) => basket.value && b.alloc.length === al.value.length && b.alloc.every(([id, p]) => al.value.some((x) => x.id === id && x.pct === p));
function usePreset(b) { state.alloc = b.alloc.map(([id, pct]) => ({ id, pct })); }
function setPct(x, v) { x.pct = Math.min(100, int0(v)); }
const dayOptions = computed(() =>
  state.freq === 'monthly'
    ? Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
    : props.data.weekdays.map((w, i) => ({ value: i, label: w })),
);
const dayModel = computed({
  get: () => (state.freq === 'monthly' ? state.monthDay : state.day),
  set: (v) => { if (state.freq === 'monthly') state.monthDay = +v; else state.day = +v; },
});
const hourOptions = Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` }));

// ---------- Simulation sur 12 mois (série fictive qui se termine au cours actuel) ----------
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const seriesCache = {};
function series(id) {
  if (!seriesCache[id]) {
    const a = A(id), r = rng([...id].reduce((s, c) => s + c.charCodeAt(0), 0) * 7919), logs = [0];
    for (let i = 1; i < 365; i++) { const g = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r()); logs.push(logs[i - 1] + a.vol * g + (id === 'usdt' ? -logs[i - 1] * 0.2 : 0)); }
    seriesCache[id] = logs.map((l) => l - logs[364]); // log-écart au dernier jour
  }
  const p = coin(id).price;
  return seriesCache[id].map((l) => p * Math.exp(l));
}
const sim = computed(() => {
  const legsOk = L.value.filter((l) => l.xof > 0), S = legsOk.map((l) => series(l.id)), step = freqOf(state.freq).days;
  const cap = !basket.value && state.cap ? int0(state.capValue) || Infinity : Infinity;
  const maxBuys = state.endMode === 'count' ? int0(state.endValue) || Infinity : Infinity;
  const budget = state.endMode === 'budget' ? int0(state.endValue) || Infinity : Infinity;
  const q = legsOk.map(() => 0), pts = [];
  let inv = 0, net = 0, buys = 0;
  for (let d = 0; d < 365; d++) {
    if (legsOk.length && d % step === 0 && buys < maxBuys && inv + state.amount <= budget && S[0][d] <= cap) {
      legsOk.forEach((l, i) => { q[i] += (l.xof - l.fee) / S[i][d]; net += l.xof - l.fee; });
      inv += state.amount; buys++;
    }
    pts.push({ d, inv, val: legsOk.reduce((s, l, i) => s + q[i] * S[i][d], 0) });
  }
  return { pts, inv, val: pts[364].val, avg: !basket.value && q[0] ? net / q[0] : 0, buys, n: legsOk.length };
});
const W = 400, H = 170, PAD = 8;
const chart = computed(() => {
  const s = sim.value, max = Math.max(1, ...s.pts.map((p) => Math.max(p.inv, p.val))) * 1.08;
  const x = (d) => (d / 364) * W, y = (v) => H - PAD - (v / max) * (H - PAD * 2);
  const line = (k) => s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
  return { inv: line('inv'), val: line('val'), area: `${line('val')}L${W},${H}L0,${H}Z`, grid: [0.25, 0.5, 0.75].map((f) => y(max * f)), x, y };
});
const pnl = computed(() => (sim.value.inv ? ((sim.value.val - sim.value.inv) / sim.value.inv) * 100 : 0));
const hover = ref(null);
function onMove(e) {
  const r = e.currentTarget.getBoundingClientRect();
  const i = Math.max(0, Math.min(364, Math.round(((e.clientX - r.left) / r.width) * 364)));
  const p = sim.value.pts[i];
  hover.value = { p, left: e.clientX - r.left, top: (chart.value.y(p.val) / H) * r.height, date: new Date(Date.now() - (364 - p.d) * 864e5).toLocaleDateString(locale.value, { day: 'numeric', month: 'short' }) };
}

// ---------- Confirmation / plans ----------
const confirm = reactive({ open: false, accept: false, busy: false });
const stopId = ref(null);
const source = (id) => props.data.sources[id];
const confirmRows = computed(() => {
  const r = props.data.confirm.rows, rows = basket.value
    ? [[r.basket, al.value.map((x) => `${coin(x.id).ticker} ${x.pct} %`).join(' · ')], [r.amount, xof(state.amount)], [r.detail, L.value.map((l) => `${coin(l.id).ticker} ${xof(l.xof)}`).join(' · ')]]
    : [[r.asset, `${coin(state.asset).name} (${coin(state.asset).ticker})`], [r.amount, xof(state.amount)]];
  rows.push([r.fee, xof(fee.value)], [r.freq, freqText(state)], [r.source, source(state.source).label], [r.first, fmtDate(nextRun(state))],
    [r.end, state.endMode === 'never' ? props.data.ends.never : state.endMode === 'count' ? t(r.after, { n: int0(state.endValue) }) : t(r.budget, { v: xof(int0(state.endValue)) })]);
  if (basket.value && state.endMode === 'budget') rows.push([r.budgetPer, L.value.map((l) => `${coin(l.id).ticker} ${xof((int0(state.endValue) * l.pct) / 100)}`).join(' · ')]);
  if (!basket.value && state.cap) rows.push([r.cap, xof(int0(state.capValue))]);
  return rows;
});
async function confirmPlan() {
  confirm.busy = true;
  const payload = {
    alloc: al.value.map((x) => ({ id: x.id, pct: x.pct })), amount: state.amount, freq: state.freq, day: state.day, monthDay: state.monthDay, hour: state.hour,
    source: state.source, endMode: state.endMode, endValue: state.endMode === 'never' ? null : int0(state.endValue), capValue: !basket.value && state.cap ? int0(state.capValue) : null,
  };
  if (state.editingId) {
    await api.updatePlan(state.editingId, payload);
    plans.value = plans.value.map((p) => (p.id === state.editingId ? { ...p, ...payload } : p));
    toast(props.data.toasts.updated, { tone: 'success' });
  } else {
    plans.value.unshift(await api.createPlan(payload));
    toast(t(props.data.toasts.created, { date: fmtDate(nextRun(payload)) }), { tone: 'success' });
  }
  save();
  state.editingId = null;
  confirm.busy = false;
  confirm.open = false;
  tab.value = 'plans';
}
async function togglePlan(p) {
  p.status = p.status === 'active' ? 'paused' : 'active';
  await api.updatePlan(p.id, { status: p.status });
  save();
  toast(p.status === 'active' ? props.data.toasts.resumed : props.data.toasts.paused);
}
function editPlan(p) {
  const multi = p.alloc.length > 1;
  Object.assign(state, {
    mode: multi ? 'basket' : 'single', asset: p.alloc[0].id, alloc: multi ? p.alloc.map((x) => ({ ...x })) : state.alloc, amount: p.amount, freq: p.freq, day: p.day,
    monthDay: p.monthDay, hour: p.hour, source: p.source, endMode: p.endMode, endValue: p.endValue ?? '', cap: !!p.capValue, capValue: p.capValue ?? '', editingId: p.id,
  });
  tab.value = 'new';
}
async function stopPlan() {
  await api.deletePlan(stopId.value);
  plans.value = plans.value.filter((p) => p.id !== stopId.value);
  save();
  stopId.value = null;
  toast(props.data.toasts.stopped);
}
const planEnd = (p) => (p.endMode === 'count' ? t(props.data.plans.countOf, { a: p.executions, b: p.endValue }) : p.endMode === 'budget' ? t(props.data.plans.budgetOf, { a: xof(p.invested), b: xof(p.endValue) }) : props.data.plans.endless);
</script>

<template>
  <div class="dca">
    <div class="dca__bar">
      <div class="z-seg dca__tabs" role="tablist" :aria-label="data.tag">
        <button type="button" role="tab" :aria-selected="tab === 'new'" @click="tab = 'new'">{{ data.tabs.new }}</button>
        <button type="button" role="tab" :aria-selected="tab === 'plans'" @click="tab = 'plans'">{{ data.tabs.plans }}<span v-if="plans.length" class="dca__count num">{{ plans.length }}</span></button>
      </div>
    </div>

    <!-- Nouveau plan -->
    <div v-if="tab === 'new'" class="dca__grid">
      <div class="z-panel dca__form">
        <section class="dca__sec">
          <header class="dca__sec-h">
            <h3><span class="dca__step">1</span>{{ basket ? data.step1.basket : data.step1.single }}</h3>
            <span class="label num">{{ basket ? t(data.step1.count, { n: al.length, max: CFG.maxAssets }) : t(data.step1.price, { asset: coin(state.asset).ticker, v: fmt.money(coin(state.asset).price) }) }}</span>
          </header>
          <div class="z-seg dca__modes">
            <button v-for="(l, k) in data.modes" :key="k" type="button" :aria-pressed="state.mode === k" @click="state.mode = k">{{ l }}</button>
          </div>
          <div class="dca__assets">
            <button v-for="a in CFG.assets" :key="a.id" type="button" class="dca__asset" :aria-pressed="al.some((x) => x.id === a.id)" @click="toggleAsset(a.id)">
              <ZCoinIcon :glyph="coin(a.id).glyph" :tone="coin(a.id).tone" :size="26" />
              <b>{{ coin(a.id).ticker }}</b><span>{{ coin(a.id).name }}</span>
            </button>
          </div>
          <template v-if="basket">
            <p class="dca__hint">{{ t(data.basket.hint, { max: CFG.maxAssets }) }}</p>
            <div class="dca__basket">
              <p class="label">{{ data.basket.presets }}</p>
              <div class="dca__chips">
                <button v-for="b in CFG.baskets" :key="b.id" type="button" class="z-chip" :aria-pressed="presetOn(b)" @click="usePreset(b)">
                  {{ data.basket.names[b.id] }} <small>{{ b.alloc.map(([id, p]) => `${coin(id).ticker} ${p}`).join(' · ') }}</small>
                </button>
              </div>
              <div class="dca__alloc">
                <div v-for="l in L" :key="l.id" class="dca__arow" :style="{ '--c': coin(l.id).tone }">
                  <div class="dca__aname"><ZCoinIcon :glyph="coin(l.id).glyph" :tone="coin(l.id).tone" :size="26" /><span><b>{{ coin(l.id).ticker }}</b><small>{{ coin(l.id).name }}</small></span></div>
                  <input type="range" min="0" max="100" step="1" class="dca__range" :value="l.pct" :style="{ '--p': `${l.pct}%` }" :aria-label="t(data.basket.share, { asset: coin(l.id).ticker })" @input="setPct(state.alloc.find((x) => x.id === l.id), $event.target.value)" />
                  <label class="dca__pct"><input inputmode="numeric" class="num" :value="l.pct" :aria-label="t(data.basket.share, { asset: coin(l.id).ticker })" @input="setPct(state.alloc.find((x) => x.id === l.id), $event.target.value)" /><span>%</span></label>
                  <span class="dca__aamt num">{{ t(data.basket.perBuy, { v: xof(l.xof) }) }}</span>
                  <button type="button" class="dca__rm" :aria-label="t(data.basket.remove, { asset: coin(l.id).ticker })" @click="toggleAsset(l.id)"><ZIcon name="close" :size="12" /></button>
                </div>
              </div>
              <div class="dca__stack" aria-hidden="true">
                <i v-for="l in L.filter((x) => x.pct > 0)" :key="l.id" :style="{ flexGrow: l.pct, background: coin(l.id).tone }" />
                <i v-if="sum < 100" class="is-rest" :style="{ flexGrow: 100 - sum }" />
              </div>
              <div class="dca__afoot">
                <span>{{ data.basket.total }} <b class="num" :class="sum === 100 ? 'is-up' : 'is-down'">{{ sum }} %</b> <span :class="{ 'is-down': sum !== 100 }">{{ sum < 100 ? t(data.basket.left, { n: 100 - sum }) : sum > 100 ? t(data.basket.over, { n: sum - 100 }) : data.basket.complete }}</span></span>
                <button type="button" class="z-chip" @click="equalize">{{ data.basket.equalize }}</button>
              </div>
              <p class="dca__hint">{{ data.basket.notAdvice }}</p>
            </div>
          </template>
        </section>

        <section class="dca__sec">
          <header class="dca__sec-h"><h3><span class="dca__step">2</span>{{ data.step2 }}</h3></header>
          <label class="dca__amount" :class="{ 'is-invalid': errs.amount }">
            <span class="sr-only">{{ data.amountLabel }}</span>
            <input v-model="amountText" inputmode="numeric" autocomplete="off" class="num" />
            <span class="dca__ccy">XOF</span>
          </label>
          <div class="dca__chips">
            <button v-for="v in CFG.presets" :key="v" type="button" class="z-chip num" :aria-pressed="state.amount === v" @click="state.amount = v">{{ fmt.num(v) }}</button>
          </div>
          <p class="dca__hint" :class="{ 'is-down': errs.amount }">{{ errs.amount || t(basket ? data.amountHint.basket : data.amountHint.single, { min: xof(basket ? CFG.minLeg : CFG.minAmount) }) }}</p>
        </section>

        <section class="dca__sec">
          <header class="dca__sec-h"><h3><span class="dca__step">3</span>{{ data.step3 }}</h3></header>
          <div class="dca__freq">
            <button v-for="f in CFG.frequencies" :key="f.id" type="button" :aria-pressed="state.freq === f.id" @click="state.freq = f.id">{{ data.frequencies[f.id] }}</button>
          </div>
          <div class="dca__row">
            <div v-if="state.freq !== 'daily'" class="dca__field"><span class="z-label">{{ state.freq === 'monthly' ? data.monthDay : data.day }}</span><ZSelect v-model="dayModel" variant="field" :options="dayOptions" :label="state.freq === 'monthly' ? data.monthDay : data.day" /></div>
            <div class="dca__field"><span class="z-label">{{ data.hour }}</span><ZSelect v-model="state.hour" variant="field" :options="hourOptions" :label="data.hour" /></div>
          </div>
        </section>

        <section class="dca__sec">
          <header class="dca__sec-h"><h3><span class="dca__step">4</span>{{ data.step4 }}</h3></header>
          <div class="dca__sources">
            <button v-for="s in CFG.sources" :key="s.id" type="button" class="dca__src" :aria-pressed="state.source === s.id" @click="state.source = s.id">
              <img :src="s.logos[0]" alt="" width="34" height="34" />
              <span class="dca__src-t"><b>{{ source(s.id).label }} <span class="dca__badge" :class="`is-${s.badge}`">{{ source(s.id).badge }}</span></b><small>{{ source(s.id).text }}</small></span>
              <span class="dca__radio" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section class="dca__sec">
          <header class="dca__sec-h"><h3><span class="dca__step">5</span>{{ data.step5 }}</h3></header>
          <div class="dca__freq is-3">
            <button v-for="(l, k) in data.ends" :key="k" type="button" :aria-pressed="state.endMode === k" @click="state.endMode = k; state.endValue = ''">{{ l }}</button>
          </div>
          <div v-if="state.endMode !== 'never'" class="dca__row">
            <div class="dca__field">
              <label class="z-label" for="dca-end">{{ state.endMode === 'count' ? data.ends.count : data.budgetLabel }}</label>
              <input id="dca-end" v-model="state.endValue" class="z-input num" inputmode="numeric" :aria-invalid="!!errs.end" @input="state.endValue = state.endValue.replace(/\D/g, '')" />
            </div>
          </div>
        </section>

        <section v-if="!basket" class="dca__sec">
          <div class="dca__toggle">
            <div><b>{{ data.cap.title }}</b><small>{{ data.cap.text }}</small></div>
            <button type="button" role="switch" class="dca__switch" :aria-checked="state.cap" :aria-label="data.cap.title" @click="state.cap = !state.cap" />
          </div>
          <div v-if="state.cap" class="dca__field">
            <label class="z-label" for="dca-cap">{{ t(data.cap.label, { asset: coin(state.asset).ticker }) }}</label>
            <input id="dca-cap" v-model="state.capValue" class="z-input num" inputmode="numeric" :aria-invalid="!!errs.cap" @input="state.capValue = state.capValue.replace(/\D/g, '')" />
            <p class="dca__hint">{{ data.cap.hint }}</p>
          </div>
        </section>
      </div>

      <aside class="dca__side">
        <div class="z-panel dca__card">
          <p class="label">{{ data.summary.title }}</p>
          <dl class="dca__sum">
            <div><dt>{{ data.summary.amount }}</dt><dd class="num">{{ xof(state.amount) }}</dd></div>
            <div><dt>{{ t(data.summary.fee, { pct: `${fmt.num(CFG.feeRate * 100)} %` }) }}</dt><dd class="num">− {{ xof(fee) }}</dd></div>
            <div><dt>{{ data.summary.net }}</dt><dd class="num">{{ xof(state.amount - fee) }}</dd></div>
            <div v-if="!basket"><dt>{{ data.summary.qty }}</dt><dd class="num">≈ {{ qty((L[0].xof - L[0].fee) / coin(L[0].id).price, L[0].id) }}</dd></div>
          </dl>
          <div v-if="basket" class="dca__brk">
            <p class="label">{{ state.endMode === 'budget' && int0(state.endValue) ? data.summary.breakdownBudget : data.summary.breakdown }}</p>
            <div class="dca__stack" aria-hidden="true"><i v-for="l in L.filter((x) => x.pct > 0)" :key="l.id" :style="{ flexGrow: l.pct, background: coin(l.id).tone }" /></div>
            <div v-for="l in L" :key="l.id" class="dca__brow">
              <span class="dca__dot" :style="{ background: coin(l.id).tone }" />
              <span>{{ coin(l.id).ticker }} · {{ l.pct }} %</span>
              <span class="r"><b class="num">{{ xof(l.xof) }}</b><small class="num">≈ {{ qty(Math.max(0, l.xof - l.fee) / coin(l.id).price, l.id) }}<template v-if="state.endMode === 'budget' && int0(state.endValue)"> · {{ t(data.summary.inTotal, { v: xof((int0(state.endValue) * l.pct) / 100) }) }}</template></small></span>
            </div>
          </div>
          <dl class="dca__sum is-total"><div><dt>{{ data.summary.monthly }}</dt><dd class="num">{{ xof(monthly) }}</dd></div></dl>
          <div class="dca__kyc">
            <div><span class="label">{{ data.summary.kyc }}</span><span class="num">{{ xof(monthly + used) }} / {{ xof(CFG.kycMonthlyLimit) }}</span></div>
            <div class="dca__kbar" :class="{ 'is-over': errs.kyc }"><i :style="{ width: `${Math.min(100, ((monthly + used) / CFG.kycMonthlyLimit) * 100)}%` }" /></div>
          </div>
          <div class="dca__next">
            <ZIcon name="clock" :size="24" />
            <div><b>{{ t(data.summary.first, { date: fmtDate(nextRun(state)) }) }}</b><small>{{ sub }}</small></div>
          </div>
          <ZButton size="lg" class="dca__cta" :disabled="!!firstErr" @click="confirm.open = true; confirm.accept = false">{{ state.editingId ? data.summary.cta.save : basket ? data.summary.cta.basket : data.summary.cta.create }}</ZButton>
          <p v-if="firstErr" class="dca__hint is-down" role="alert">{{ firstErr }}</p>
        </div>

        <div class="z-panel dca__card">
          <div class="dca__sec-h"><p class="label">{{ data.sim.title }}</p><span class="label">{{ basket ? t(data.sim.basket, { k: sim.n, n: sim.buys }) : t(data.sim.single, { asset: coin(state.asset).ticker, n: sim.buys }) }}</span></div>
          <div class="dca__chart" @pointermove="onMove" @pointerleave="hover = null">
            <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" role="img" :aria-label="data.sim.label">
              <defs>
                <linearGradient id="dca-gl" x1="0" x2="1"><stop offset="0" stop-color="var(--color-brand-primary-300)" /><stop offset="1" stop-color="var(--color-brand-secondary-300)" /></linearGradient>
                <linearGradient id="dca-ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--color-brand-primary-300)" stop-opacity=".3" /><stop offset="1" stop-color="var(--color-brand-secondary)" stop-opacity="0" /></linearGradient>
              </defs>
              <line v-for="g in chart.grid" :key="g" x1="0" :x2="W" :y1="g" :y2="g" class="dca__grid-l" />
              <path :d="chart.area" fill="url(#dca-ga)" />
              <path :d="chart.inv" class="dca__inv" vector-effect="non-scaling-stroke" />
              <path :d="chart.val" fill="none" stroke="url(#dca-gl)" stroke-width="2" vector-effect="non-scaling-stroke" />
              <line v-if="hover" :x1="chart.x(hover.p.d)" :x2="chart.x(hover.p.d)" y1="0" :y2="H" class="dca__hair" vector-effect="non-scaling-stroke" />
            </svg>
            <div v-if="hover" class="dca__tip" :style="{ left: `${hover.left}px`, top: `${hover.top}px` }">
              <span class="label">{{ hover.date }}</span><br>{{ data.sim.value }} <b class="num">{{ xof(hover.p.val) }}</b><br>{{ data.sim.invested }} <span class="num">{{ xof(hover.p.inv) }}</span>
            </div>
          </div>
          <div class="dca__legend"><span><i class="is-val" />{{ data.sim.value }}</span><span><i class="is-inv" />{{ data.sim.invested }}</span></div>
          <div class="dca__kpis">
            <div><span class="label">{{ data.sim.invested }}</span><b class="num">{{ xof(sim.inv) }}</b></div>
            <div><span class="label">{{ data.sim.final }}</span><b class="num">{{ xof(sim.val) }}</b></div>
            <div><span class="label">{{ basket ? data.sim.executed : data.sim.avg }}</span><b class="num">{{ basket ? sim.buys : sim.avg ? xof(sim.avg) : '—' }}</b></div>
            <div><span class="label">{{ data.sim.pnl }}</span><b class="num" :class="pnl >= 0 ? 'is-up' : 'is-down'">{{ pnl >= 0 ? '+' : '' }}{{ fmt.num(pnl, 1, 1) }} %</b></div>
          </div>
          <p class="dca__disclaimer">{{ data.sim.disclaimer }}</p>
        </div>
      </aside>
    </div>

    <!-- Mes plans -->
    <div v-else class="dca__plans">
      <div v-if="!plans.length" class="z-panel dca__empty">
        <ZIcon name="chart" :size="40" />
        <strong>{{ data.plans.empty.title }}</strong>{{ data.plans.empty.text }}
        <ZButton @click="tab = 'new'">{{ data.plans.empty.cta }}</ZButton>
      </div>
      <article v-for="p in plans" :key="p.id" class="z-panel dca__plan">
        <span v-if="p.alloc.length > 1" class="dca__coins"><ZCoinIcon v-for="x in p.alloc" :key="x.id" :glyph="coin(x.id).glyph" :tone="coin(x.id).tone" :size="34" /></span>
        <ZCoinIcon v-else :glyph="coin(p.alloc[0].id).glyph" :tone="coin(p.alloc[0].id).tone" :size="40" />
        <div class="dca__pbody">
          <div class="dca__ptitle">
            {{ p.alloc.length > 1 ? t(data.plans.basket, { v: xof(p.amount), n: p.alloc.length }) : t(data.plans.single, { v: xof(p.amount), asset: coin(p.alloc[0].id).ticker }) }}
            <span class="dca__status" :class="`is-${p.status}`">{{ p.status === 'active' ? data.plans.active : data.plans.paused }}</span>
          </div>
          <p class="dca__psub">{{ freqText(p) }} · {{ t(data.plans.via, { source: source(p.source).label }) }}<template v-if="p.capValue"> · {{ t(data.plans.capped, { v: xof(p.capValue) }) }}</template></p>
          <template v-if="p.alloc.length > 1">
            <div class="dca__stack" aria-hidden="true"><i v-for="x in p.alloc" :key="x.id" :style="{ flexGrow: x.pct, background: coin(x.id).tone }" /></div>
            <div class="dca__palloc"><span v-for="l in legs(p.amount, p.alloc)" :key="l.id"><i :style="{ background: coin(l.id).tone }" />{{ coin(l.id).ticker }} {{ l.pct }} % · {{ xof(l.xof) }}</span></div>
          </template>
          <div class="dca__meta">
            <span>{{ data.plans.next }} <b>{{ p.status === 'active' ? fmtDate(nextRun(p)) : data.plans.paused }}</b></span>
            <span>{{ data.plans.progress }} <b>{{ planEnd(p) }}</b></span>
            <span>{{ data.plans.accumulated }} <b>{{ p.alloc.map((x) => qty(p.holdings?.[x.id] || 0, x.id)).join(' · ') }}</b></span>
          </div>
        </div>
        <div class="dca__actions">
          <ZButton variant="ghost" @click="togglePlan(p)">{{ p.status === 'active' ? data.plans.pause : data.plans.resume }}</ZButton>
          <ZButton variant="ghost" @click="editPlan(p)">{{ data.plans.edit }}</ZButton>
          <ZButton variant="ghost" class="is-danger" @click="stopId = p.id">{{ data.plans.stop }}</ZButton>
        </div>
      </article>
    </div>

    <ZDialog v-if="confirm.open" :title="state.editingId ? data.confirm.titleEdit : data.confirm.title" :close-label="data.confirm.cancel" @close="confirm.open = false">
      <p class="dca__msub">{{ basket ? data.confirm.textBasket : data.confirm.textSingle }}</p>
      <dl class="dca__sum"><div v-for="[k, v] in confirmRows" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></div></dl>
      <label class="dca__check"><input v-model="confirm.accept" type="checkbox" /> <span>{{ data.confirm.accept }}</span></label>
      <template #footer>
        <ZButton variant="ghost" @click="confirm.open = false">{{ data.confirm.cancel }}</ZButton>
        <ZButton :disabled="!confirm.accept || confirm.busy" @click="confirmPlan">{{ confirm.busy ? data.confirm.sending : data.confirm.ok }}</ZButton>
      </template>
    </ZDialog>

    <ZDialog v-if="stopId" :title="data.stop.title" :close-label="data.stop.keep" size="sm" @close="stopId = null">
      <p class="dca__msub">{{ data.stop.text }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="stopId = null">{{ data.stop.keep }}</ZButton>
        <ZButton class="is-danger-fill" @click="stopPlan">{{ data.stop.ok }}</ZButton>
      </template>
    </ZDialog>
  </div>
</template>

<style scoped>
.dca { display: grid; gap: 16px; }
.dca__bar { display: flex; justify-content: flex-end; }
.dca__tabs button { padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; }
.dca__count { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--gradient-brand); color: var(--color-on-brand); font-size: 10px; }
.dca__grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.dca__form { padding: 22px; }
.dca__sec { padding: 18px 0; border-top: 1px solid var(--color-line-default); }
.dca__sec:first-child { padding-top: 0; border-top: 0; }
.dca__sec-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.dca__sec-h .label { color: var(--color-text-dim); }
.dca__sec-h h3 { display: flex; align-items: center; font-size: 14px; font-weight: var(--font-weight-semibold); }
.dca__step { display: inline-grid; place-items: center; width: 22px; height: 22px; margin-right: 10px; border-radius: 50%; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); font-size: 11px; color: var(--color-brand-primary-300); }
.dca__modes { margin-bottom: 12px; }
.dca__assets { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.dca__asset { display: grid; justify-items: start; gap: 6px; padding: 12px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); text-align: left; transition: border-color var(--motion-duration-hover), box-shadow var(--motion-duration-hover); }
.dca__asset:hover { border-color: var(--color-line-strong); }
.dca__asset[aria-pressed='true'] { border-color: var(--color-brand-primary-300); box-shadow: 0 8px 30px -14px var(--glow-brand); }
.dca__asset b { font-size: 13px; }
.dca__asset span { font-size: 11px; color: var(--color-text-dim); }
.dca__hint { margin-top: 8px; font-size: 12px; color: var(--color-text-dim); }
.is-down { color: var(--color-state-down) !important; }
.is-up { color: var(--color-state-up) !important; }
.dca__basket { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--color-line-default); }
.dca__basket > .label { color: var(--color-text-dim); margin-bottom: 8px; }
.dca__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.dca__chips small { margin-left: 4px; opacity: 0.65; }
.dca__alloc { display: grid; gap: 8px; margin-top: 12px; }
.dca__arow { display: grid; grid-template-columns: minmax(96px, auto) minmax(0, 1fr) 76px 112px 28px; gap: 12px; align-items: center; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.dca__aname { display: flex; align-items: center; gap: 10px; }
.dca__aname b { display: block; font-size: 13px; }
.dca__aname small { font-size: 11px; color: var(--color-text-dim); }
.dca__range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; background: linear-gradient(90deg, var(--c) var(--p), var(--fill-2) var(--p)); }
.dca__range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--color-paper); border: 3px solid var(--c); cursor: pointer; }
.dca__range::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--color-paper); border: 3px solid var(--c); cursor: pointer; }
.dca__range:focus-visible { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 4px; }
.dca__pct { display: flex; align-items: center; gap: 4px; padding: 7px 8px; border-radius: var(--radius-sm); background: var(--fill-1); border: 1px solid var(--color-line-default); }
.dca__pct:focus-within { border-color: var(--color-brand-secondary-300); }
.dca__pct input { width: 100%; min-width: 0; background: none; border: 0; outline: none; text-align: right; font: inherit; font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-text-default); }
.dca__pct span { font-size: 12px; color: var(--color-text-dim); }
.dca__aamt { font-size: 11.5px; color: var(--color-text-muted); text-align: right; white-space: nowrap; }
.dca__rm { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius-sm); color: var(--color-text-dim); }
.dca__rm:hover { color: var(--color-state-down); background: color-mix(in srgb, var(--color-state-down) 8%, transparent); }
.dca__stack { display: flex; gap: 2px; height: 8px; margin: 10px 0 6px; overflow: hidden; border-radius: 4px; }
.dca__stack i { display: block; min-width: 2px; height: 100%; }
.dca__stack i.is-rest { background: var(--fill-2); }
.dca__afoot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 12px; font-size: 13px; color: var(--color-text-muted); }
.dca__afoot b { margin: 0 6px 0 4px; }
.dca__amount { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover); }
.dca__amount:focus-within { border-color: var(--color-brand-secondary-300); }
.dca__amount.is-invalid { border-color: var(--color-state-down); }
.dca__amount input { flex: 1; min-width: 0; padding: 0; background: none; border: 0; outline: none; font: inherit; font-size: 26px; font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; color: var(--color-text-default); }
.dca__ccy { padding: 6px 10px; border-radius: var(--radius-pill); background: var(--fill-2); font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-text-muted); }
.dca__freq { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.dca__freq.is-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dca__freq button { padding: 11px 8px; line-height: 1.25; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); transition: color var(--motion-duration-hover), border-color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.dca__freq button:hover { color: var(--color-text-default); }
.dca__freq button[aria-pressed='true'], .dca__modes button[aria-pressed='true'] { color: var(--color-text-default); background: color-mix(in srgb, var(--color-brand-primary) 24%, transparent); border-color: var(--color-brand-primary-300); }
.dca__row { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.dca__field { flex: 1; min-width: 140px; margin-top: 10px; }
.dca__row .dca__field { margin-top: 0; }
.dca__sources { display: grid; gap: 8px; }
.dca__src { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); text-align: left; transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.dca__src[aria-pressed='true'] { border-color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 14%, var(--color-bg-surface-2)); }
.dca__src img { flex: none; width: 34px; height: 34px; padding: 2px; border-radius: var(--radius-md); background: var(--color-paper); object-fit: contain; }
.dca__src-t { flex: 1; min-width: 0; }
.dca__src-t b { display: block; font-size: 13px; }
.dca__src-t small { display: block; margin-top: 2px; font-size: 12px; line-height: 1.4; color: var(--color-text-dim); }
.dca__badge { margin-left: 6px; padding: 3px 7px; border-radius: var(--radius-pill); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; --tone: var(--color-state-up); color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); }
.dca__badge.is-warn { --tone: var(--color-state-warn); }
.dca__radio { position: relative; flex: none; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--color-line-strong); }
.dca__src[aria-pressed='true'] .dca__radio { border-color: var(--color-brand-primary-300); }
.dca__src[aria-pressed='true'] .dca__radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--gradient-brand); }
.dca__toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dca__toggle b { display: block; font-size: 13px; }
.dca__toggle small { font-size: 12px; color: var(--color-text-dim); }
.dca__switch { position: relative; flex: none; width: 38px; height: 22px; border-radius: 11px; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); transition: background-color var(--motion-duration-hover); }
.dca__switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--color-paper); box-shadow: 0 1px 3px color-mix(in srgb, var(--color-paper-ink) 30%, transparent); transition: transform var(--duration-panel) var(--motion-ease-out); }
.dca__switch[aria-checked='true'] { background: var(--gradient-brand); border-color: transparent; }
.dca__switch[aria-checked='true']::after { transform: translateX(16px); }
.dca__side { display: grid; gap: 16px; position: sticky; top: calc(var(--space-nav-height) + 20px); }
.dca__card { padding: 22px; }
.dca__card > .label { color: var(--color-text-dim); margin-bottom: 8px; }
.dca__sum { display: grid; margin: 0; }
.dca__sum div { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; padding: 9px 0; font-size: 13px; }
.dca__sum dt { color: var(--color-text-muted); }
.dca__sum dd { margin: 0; text-align: right; font-weight: var(--font-weight-semibold); }
.dca__sum.is-total { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--color-line-default); }
.dca__sum.is-total dd { font-size: 18px; }
.dca__brk { margin-top: 6px; }
.dca__brk > .label { color: var(--color-text-dim); }
.dca__brow { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 7px 0; font-size: 12.5px; color: var(--color-text-muted); }
.dca__dot { width: 8px; height: 8px; border-radius: 50%; }
.dca__brow .r { text-align: right; }
.dca__brow b { display: block; color: var(--color-text-default); }
.dca__brow small { display: block; font-size: 11px; color: var(--color-text-dim); }
.dca__kyc { margin-top: 12px; }
.dca__kyc > div:first-child { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 11.5px; color: var(--color-text-muted); }
.dca__kyc .label { color: var(--color-text-dim); }
.dca__kbar { height: 4px; margin-top: 6px; overflow: hidden; border-radius: 2px; background: var(--fill-2); }
.dca__kbar i { display: block; height: 100%; border-radius: 2px; background: var(--gradient-brand-soft); transition: width var(--duration-panel) var(--motion-ease-out); }
.dca__kbar.is-over i { background: var(--color-state-down); }
.dca__next { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px 14px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-brand-secondary) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-brand-secondary-300) 24%, transparent); }
.dca__next :deep(svg) { flex: none; color: var(--color-brand-secondary-300); }
.dca__next b { display: block; font-size: 13px; }
.dca__next small { font-size: 12px; color: var(--color-text-muted); }
.dca__cta { width: 100%; margin-top: 16px; height: 52px; }
.dca__chart { position: relative; margin: 6px -4px 0; }
.dca__chart svg { display: block; width: 100%; height: 170px; }
.dca__grid-l { stroke: var(--color-line-default); }
.dca__inv { fill: none; stroke: var(--color-text-dim); stroke-width: 1.2; stroke-dasharray: 3 3; }
.dca__hair { stroke: var(--color-line-strong); }
.dca__tip { position: absolute; z-index: 2; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); font-size: 11px; white-space: nowrap; pointer-events: none; transform: translate(-50%, -110%); }
.dca__legend { display: flex; gap: 14px; margin-top: 6px; font-size: 11px; color: var(--color-text-muted); }
.dca__legend i { display: inline-block; width: 10px; height: 2px; margin-right: 6px; vertical-align: middle; border-radius: 1px; }
.dca__legend .is-val { background: var(--gradient-brand-soft); }
.dca__legend .is-inv { background: var(--color-text-dim); }
.dca__kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.dca__kpis div { padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.dca__kpis .label { color: var(--color-text-dim); }
.dca__kpis b { display: block; margin-top: 4px; font-size: 15px; font-weight: var(--font-weight-semibold); }
.dca__disclaimer { margin-top: 12px; font-size: 11.5px; line-height: 1.5; color: var(--color-text-dim); }
.dca__plans { display: grid; gap: 12px; }
.dca__empty { display: grid; justify-items: center; gap: 6px; padding: 50px 20px; text-align: center; color: var(--color-text-muted); }
.dca__empty :deep(svg) { color: var(--color-brand-primary-300); }
.dca__empty strong { margin-top: 8px; font-size: 16px; color: var(--color-text-default); }
.dca__empty :deep(.z-btn) { margin-top: 14px; }
.dca__plan { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 20px 22px; }
.dca__coins { display: flex; }
.dca__coins > * + * { margin-left: -12px; box-shadow: 0 0 0 2px var(--color-bg-surface); }
.dca__ptitle { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 15px; font-weight: var(--font-weight-semibold); }
.dca__status { padding: 4px 8px; border-radius: var(--radius-pill); font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; --tone: var(--color-state-up); color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); }
.dca__status.is-paused { --tone: var(--color-state-warn); }
.dca__psub { margin-top: 4px; font-size: 12px; color: var(--color-text-muted); }
.dca__palloc { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: var(--color-text-muted); }
.dca__palloc i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; }
.dca__meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 8px; font-size: 12px; color: var(--color-text-muted); }
.dca__meta b { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.dca__actions { display: flex; gap: 6px; flex-wrap: wrap; }
.dca__actions .is-danger:hover { color: var(--color-state-down); border-color: color-mix(in srgb, var(--color-state-down) 45%, transparent); }
:deep(.is-danger-fill) { background: var(--color-state-down) !important; box-shadow: none !important; }
.dca__msub { font-size: 14px; color: var(--color-text-muted); }
.dca__check { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; font-size: 12px; line-height: 1.5; color: var(--color-text-muted); cursor: pointer; }
.dca__check input { margin-top: 2px; accent-color: var(--color-brand-primary); }
@media (max-width: 960px) { .dca__grid { grid-template-columns: minmax(0, 1fr); } .dca__side { position: static; } }
@media (max-width: 700px) { .dca__plan { grid-template-columns: auto minmax(0, 1fr); } .dca__actions { grid-column: 1 / -1; } }
@media (max-width: 560px) {
  .dca__form, .dca__card { padding: 18px; }
  .dca__assets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .dca__freq { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dca__arow { grid-template-columns: minmax(0, 1fr) 76px 28px; }
  .dca__range { grid-column: 1 / -1; grid-row: 2; }
  .dca__aamt { display: none; }
  .dca__bar { justify-content: stretch; } .dca__tabs { width: 100%; }
}
</style>
