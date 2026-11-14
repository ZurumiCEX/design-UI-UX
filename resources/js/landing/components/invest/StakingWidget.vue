<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { toast } from '../../composables/useToast.js';
import { staking as CFG } from '../../content/data.js';
import ZButton from '../ui/ZButton.vue';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZDialog from '../ui/ZDialog.vue';
import ZIcon from '../ui/ZIcon.vue';

// Épargne (staking). Adapté du widget « Zurumi · Widget Staking » v1.0.
// Production : le widget parle uniquement à l'API Zurumi (BFF) → adaptateur → fournisseur de staking.
//   GET /api/v1/staking/products · GET /provider/status · POST /quote · POST /positions (Idempotency-Key)
//   POST /positions/{id}/unstake · POST /positions/{id}/withdraw · GET /positions · GET /rewards
// Cycle de vie : pending → activating → active → unbonding → withdrawable → closed (failed : re-crédit).
// DÉMO : `api` est simulé et l'état est conservé dans localStorage ; les prix viennent du flux de marché.
const props = defineProps({ data: { type: Object, required: true } }); // pages.staking
const { fmt, t, i18n } = useI18n();
const feed = useMarketFeed();
const DAY = 864e5;
const KEY = 'zurumi.staking.v1';

const coin = (p) => feed.coins.find((c) => c.id === p.coin);
const price = (p) => coin(p)?.price ?? 0;
const P = (id) => CFG.products.find((p) => p.id === id);
const netApy = (p) => p.grossApy * (1 - CFG.commission);
const L = (p) => props.data.products[p.id];
const qty = (n, p) => `${fmt.num(n, 0, p.dec)} ${coin(p).ticker}`;
const pct = (n) => `${fmt.num(n, 2, 2)} %`;
const parseDec = (v) => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const locale = computed(() => (i18n.locale === 'fr' ? 'fr-FR' : 'en-GB'));
const time = (d) => new Date(d).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });

// ---------- État ----------
function seed() {
  const now = Date.now();
  return {
    balances: { ...CFG.demoBalances },
    positions: [
      { id: 'stk_demo1', product: 'eth', amount: 0.5, status: 'active', compound: true, createdAt: now - 64 * DAY, activatedAt: now - 62 * DAY, rewardsBase: 0, demo: true, providerRef: 'prv_8f21…' },
      { id: 'stk_demo2', product: 'sol', amount: 10, status: 'unbonding', compound: true, createdAt: now - 40 * DAY, unlockAt: now + DAY + 4 * 3600e3, rewardsBase: 0.0712, demo: true, providerRef: 'prv_33ab…' },
      { id: 'stk_demo3', product: 'bnb', amount: 1.2, status: 'withdrawable', compound: false, createdAt: now - 90 * DAY, unlockAt: now - 3600e3, rewardsBase: 0.0061, demo: true, providerRef: 'prv_c90e…' },
    ],
  };
}
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } };
const db = reactive(load());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* indisponible */ } };
const ui = reactive({ tab: 'products', sort: 'apy', provider: 'operational', fetchedAt: Date.now() });
const now = ref(Date.now());

// ---------- Adaptateur API (simulé) ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const api = {
  async stake({ product, amount, compound }) {
    if (ui.provider === 'maintenance') throw new Error(props.data.stake.errors.maintenance);
    const key = crypto.randomUUID?.() ?? String(Date.now()); // Idempotency-Key
    await wait(700);
    return { id: `stk_${key.slice(0, 8)}`, product, amount, compound, status: 'pending', createdAt: Date.now(), rewardsBase: 0, providerRef: `prv_${key.slice(9, 13)}…` };
  },
  async unstake() { if (ui.provider === 'maintenance') throw new Error(props.data.stake.errors.maintenance); await wait(600); },
  async withdraw() { await wait(500); },
};

// ---------- Calculs ----------
function rewardsOf(pos) {
  const p = P(pos.product);
  if (pos.status !== 'active' || !pos.activatedAt) return pos.rewardsBase || 0;
  return (pos.rewardsBase || 0) + (pos.amount * netApy(p)) / 100 * (now.value - pos.activatedAt) / (365 * DAY);
}
function dur(ms) {
  const u = props.data.units;
  if (ms <= 0) return props.data.position.now;
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 3600e3), m = Math.floor((ms % 3600e3) / 60e3);
  return d ? `${d} ${u.d} ${h} ${u.h}` : h ? `${h} ${u.h} ${m} ${u.min}` : `${Math.max(1, m)} ${u.min}`;
}
const kpis = computed(() => {
  let staked = 0, rewards = 0, weighted = 0, activeVal = 0, unb = 0, unbN = 0, actives = 0;
  for (const pos of db.positions) {
    const p = P(pos.product), v = pos.amount * price(p);
    rewards += rewardsOf(pos) * price(p);
    if (['pending', 'activating', 'active'].includes(pos.status)) staked += v;
    if (pos.status === 'active') { weighted += v * netApy(p); activeVal += v; actives++; }
    if (['unbonding', 'withdrawable'].includes(pos.status)) { unb += v; unbN++; }
  }
  return { staked, rewards, apy: activeVal ? weighted / activeVal : null, unb, unbN, actives };
});
const products = computed(() => {
  let list = [...CFG.products];
  if (ui.sort === 'apy') list.sort((a, b) => b.grossApy - a.grossApy);
  if (ui.sort === 'unbond') list.sort((a, b) => a.unbondDays - b.unbondDays);
  if (ui.sort === 'held') list = list.filter((p) => (db.balances[p.id] || 0) > 0).sort((a, b) => db.balances[b.id] * price(b) - db.balances[a.id] * price(a));
  return list;
});
const stakedIn = (p) => db.positions.filter((x) => x.product === p.id && ['pending', 'activating', 'active'].includes(x.status)).reduce((s, x) => s + x.amount, 0);
const ORDER = { pending: 0, activating: 1, withdrawable: 2, active: 3, unbonding: 4, failed: 5 };
const STEP = { pending: 0, activating: 1, active: 2 };
const positions = computed(() => [...db.positions].sort((a, b) => ORDER[a.status] - ORDER[b.status]));
const rewardRows = computed(() => {
  const rows = [];
  for (const pos of db.positions.filter((x) => x.status === 'active')) {
    const p = P(pos.product), daily = (pos.amount * p.grossApy) / 100 / 365;
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * DAY);
      if (pos.activatedAt && d.getTime() < pos.activatedAt) continue;
      rows.push({ key: `${pos.id}-${i}`, d, p, gross: daily, fee: daily * CFG.commission, net: daily * (1 - CFG.commission) });
    }
  }
  return rows.sort((a, b) => b.d - a.d);
});
const off = computed(() => ui.provider === 'maintenance');

// ---------- Staker ----------
const stake = reactive({ open: false, product: null, amount: '', compound: true, accept: false, busy: false, error: '' });
function openStake(id) {
  const p = P(id);
  Object.assign(stake, { open: true, product: p, amount: '', compound: p.compound, accept: false, busy: false, error: '' });
}
const sp = computed(() => stake.product);
const sAmount = computed(() => parseDec(stake.amount));
const sErr = computed(() => {
  const p = sp.value, e = props.data.stake.errors;
  if (!p) return '';
  if (off.value) return e.maintenance;
  if (sAmount.value && sAmount.value < p.min) return t(e.min, { v: qty(p.min, p) });
  if (sAmount.value > (db.balances[p.id] || 0)) return e.balance;
  return stake.error;
});
const est = (days) => (sAmount.value * netApy(sp.value)) / 100 * days / 365;
function setPct(v) {
  const p = sp.value, bal = db.balances[p.id] || 0;
  stake.amount = String(Math.floor(bal * v / 100 * 10 ** p.dec) / 10 ** p.dec);
}
async function confirmStake() {
  const p = sp.value, a = sAmount.value;
  stake.busy = true;
  try {
    const pos = await api.stake({ product: p.id, amount: a, compound: p.compound && stake.compound });
    db.balances[p.id] = +(db.balances[p.id] - a).toFixed(p.dec);
    db.positions.unshift(pos);
    save();
    stake.open = false;
    toast(t(props.data.stake.done, { v: qty(a, p), when: L(p).activation }), { tone: 'success' });
    ui.tab = 'positions';
  } catch (err) {
    stake.error = err.message;
  }
  stake.busy = false;
}

// ---------- Retirer / récupérer ----------
const un = reactive({ open: false, id: null, amount: '', busy: false, error: '' });
const upos = computed(() => db.positions.find((x) => x.id === un.id));
const up = computed(() => upos.value && P(upos.value.product));
function openUnstake(id) { Object.assign(un, { open: true, id, amount: '', busy: false, error: '' }); }
const uAmount = computed(() => parseDec(un.amount));
const uErr = computed(() => {
  const pos = upos.value, p = up.value, e = props.data.unstake.errors;
  if (!pos) return '';
  if (uAmount.value > pos.amount + 1e-12) return e.over;
  if (uAmount.value && pos.amount - uAmount.value > 0 && pos.amount - uAmount.value < p.min) return t(e.rest, { v: qty(p.min, p) });
  return un.error;
});
async function confirmUnstake() {
  const pos = upos.value, p = up.value, a = Math.min(uAmount.value, pos.amount);
  un.busy = true;
  try {
    await api.unstake(pos.id, a);
    const r = rewardsOf(pos), unlockAt = Date.now() + p.unbondDays * DAY;
    if (a >= pos.amount - 1e-12) Object.assign(pos, { status: 'unbonding', rewardsBase: r, unlockAt });
    else {
      const rest = pos.amount - a;
      db.positions.push({ id: `stk_${Math.random().toString(36).slice(2, 10)}`, product: p.id, amount: a, status: 'unbonding', unlockAt, rewardsBase: (r * a) / pos.amount, createdAt: Date.now(), providerRef: pos.providerRef });
      Object.assign(pos, { rewardsBase: (r * rest) / pos.amount, activatedAt: Date.now(), amount: +rest.toFixed(p.dec) });
    }
    save();
    un.open = false;
    toast(t(props.data.unstake.done, { v: qty(a, p), when: dur(unlockAt - Date.now()) }), { tone: 'success' });
  } catch (err) {
    un.error = err.message;
  }
  un.busy = false;
}
async function withdraw(id) {
  const pos = db.positions.find((x) => x.id === id), p = P(pos.product);
  await api.withdraw(id);
  const total = pos.amount + (pos.compound ? rewardsOf(pos) : 0);
  db.balances[p.id] = +((db.balances[p.id] || 0) + total).toFixed(p.dec);
  db.positions.splice(db.positions.indexOf(pos), 1);
  save();
  toast(t(props.data.toasts.credited, { v: qty(total, p) }), { tone: 'success' });
}
function reset() {
  Object.assign(db, seed());
  save();
  toast(props.data.toasts.reset);
}

// ---------- Cycle de vie (en production : webhooks du fournisseur) ----------
let timer = 0;
function tick() {
  now.value = Date.now();
  let changed = false;
  for (const pos of db.positions) {
    if (pos.status === 'pending' && now.value - pos.createdAt > CFG.demoSpeed.pendingMs) { pos.status = 'activating'; changed = true; }
    if (pos.status === 'activating' && now.value - pos.createdAt > CFG.demoSpeed.activatingMs) {
      Object.assign(pos, { status: 'active', activatedAt: now.value });
      changed = true;
      toast(t(props.data.toasts.active, { asset: coin(P(pos.product)).ticker }), { tone: 'success' });
    }
    if (pos.status === 'unbonding' && now.value >= pos.unlockAt) { pos.status = 'withdrawable'; changed = true; }
  }
  if (changed) save();
}
onMounted(() => { timer = setInterval(tick, 1000); });
onBeforeUnmount(() => clearInterval(timer));
watch(() => ui.provider, () => { ui.fetchedAt = Date.now(); });
</script>

<template>
  <div class="stk">
    <div class="stk__bar">
      <div class="z-seg stk__tabs" role="tablist" :aria-label="data.tag">
        <button type="button" role="tab" :aria-selected="ui.tab === 'products'" @click="ui.tab = 'products'">{{ data.tabs.products }}</button>
        <button type="button" role="tab" :aria-selected="ui.tab === 'positions'" @click="ui.tab = 'positions'">
          {{ data.tabs.positions }}<span v-if="db.positions.length" class="stk__count num">{{ db.positions.length }}</span>
        </button>
      </div>
    </div>

    <div v-if="ui.provider !== 'operational'" class="stk__banner" :class="`is-${ui.provider}`" role="status">
      <ZIcon name="alert" :size="18" />
      <p><strong>{{ data.banner[ui.provider].title }}</strong> {{ t(data.banner[ui.provider].text, { time: time(ui.fetchedAt) }) }}</p>
    </div>

    <div class="stk__kpis">
      <div class="z-panel stk__kpi"><span class="label">{{ data.kpis.staked }}</span><b class="num">{{ fmt.money(kpis.staked) }}</b><small>{{ t(data.kpis.stakedSub, { n: kpis.actives }) }}</small></div>
      <div class="z-panel stk__kpi"><span class="label">{{ data.kpis.rewards }}</span><b class="num is-up">{{ fmt.money(kpis.rewards) }}</b><small>{{ data.kpis.rewardsSub }}</small></div>
      <div class="z-panel stk__kpi"><span class="label">{{ data.kpis.apy }}</span><b class="num">{{ kpis.apy == null ? '—' : pct(kpis.apy) }}</b><small>{{ data.kpis.apySub }}</small></div>
      <div class="z-panel stk__kpi"><span class="label">{{ data.kpis.unbond }}</span><b class="num">{{ fmt.money(kpis.unb) }}</b><small>{{ kpis.unbN ? t(data.kpis.unbondSub, { n: kpis.unbN }) : data.kpis.unbondNone }}</small></div>
    </div>

    <!-- Produits -->
    <section v-if="ui.tab === 'products'">
      <div class="stk__toolbar">
        <div class="stk__chips">
          <button v-for="(label, k) in data.sort" :key="k" type="button" class="z-chip" :aria-pressed="ui.sort === k" @click="ui.sort = k">{{ label }}</button>
        </div>
        <span class="label">{{ t(data.updated, { time: time(ui.fetchedAt) }) }}</span>
      </div>
      <div class="stk__products">
        <article v-for="p in products" :key="p.id" class="z-panel stk__product">
          <header class="stk__ptop">
            <ZCoinIcon :glyph="coin(p).glyph" :tone="coin(p).tone" :size="36" />
            <div class="stk__pname"><strong>{{ coin(p).name }}</strong><small>{{ L(p).network }}</small></div>
            <div class="stk__apy"><strong class="num">{{ pct(netApy(p)) }}</strong><small>{{ data.product.apy }}</small></div>
          </header>
          <dl class="stk__facts">
            <div><dt>{{ data.product.gross }}</dt><dd class="num">{{ t(data.product.grossValue, { gross: pct(p.grossApy), fee: `${fmt.num(CFG.commission * 100)} %` }) }}</dd></div>
            <div><dt>{{ data.product.min }}</dt><dd class="num">{{ qty(p.min, p) }}</dd></div>
            <div><dt>{{ data.product.activation }}</dt><dd>{{ L(p).activation }}</dd></div>
            <div><dt>{{ data.product.unbond }}</dt><dd>{{ L(p).unbond }}</dd></div>
          </dl>
          <footer class="stk__pfoot">
            <small>{{ data.product.available }} <b class="num">{{ qty(db.balances[p.id] || 0, p) }}</b><template v-if="stakedIn(p)"><br>{{ data.product.staked }} <b class="num">{{ qty(stakedIn(p), p) }}</b></template></small>
            <ZButton :disabled="off || (db.balances[p.id] || 0) < p.min" @click="openStake(p.id)">{{ (db.balances[p.id] || 0) < p.min ? data.product.insufficient : data.product.stake }}</ZButton>
          </footer>
        </article>
        <div v-if="!products.length" class="z-panel stk__empty"><strong>{{ data.emptyHeld.title }}</strong>{{ data.emptyHeld.text }}</div>
      </div>
      <p class="stk__disclaimer">{{ data.disclaimer }}</p>
    </section>

    <!-- Positions -->
    <section v-else>
      <div v-if="!db.positions.length" class="z-panel stk__empty">
        <ZIcon name="shield" :size="40" />
        <strong>{{ data.emptyPositions.title }}</strong>{{ data.emptyPositions.text }}
        <ZButton @click="ui.tab = 'products'">{{ data.emptyPositions.cta }}</ZButton>
      </div>
      <div v-else class="stk__positions">
        <article v-for="pos in positions" :key="pos.id" class="z-panel stk__pos">
          <ZCoinIcon :glyph="coin(P(pos.product)).glyph" :tone="coin(P(pos.product)).tone" :size="42" />
          <div class="stk__pbody">
            <div class="stk__ptitle">
              <span class="num">{{ qty(pos.amount, P(pos.product)) }}</span>
              <span class="stk__approx num">≈ {{ fmt.money(pos.amount * price(P(pos.product))) }}</span>
              <span class="stk__status" :class="`is-${pos.status}`">{{ data.status[pos.status] }}</span>
              <span v-if="pos.demo" class="stk__demo">{{ data.position.example }}</span>
            </div>
            <div class="stk__meta">
              <template v-if="pos.status === 'pending' || pos.status === 'activating'">
                <span>{{ data.position.expected }} <b>{{ L(P(pos.product)).activation }}</b></span>
                <span>{{ data.position.ref }} <b>{{ pos.providerRef }}</b></span>
              </template>
              <template v-else-if="pos.status === 'active'">
                <span>{{ data.position.apy }} <b class="num">{{ pct(netApy(P(pos.product))) }}</b></span>
                <span>{{ data.position.rewards }} <b class="num is-up">+{{ qty(rewardsOf(pos), P(pos.product)) }}</b></span>
                <span>{{ data.position.since }} <b>{{ new Date(pos.activatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) }}</b></span>
                <span>{{ data.position.compound }} <b>{{ pos.compound ? data.position.on : data.position.off }}</b></span>
              </template>
              <template v-else-if="pos.status === 'unbonding'">
                <span>{{ data.position.availableIn }} <b class="num">{{ dur(pos.unlockAt - now) }}</b></span>
                <span>{{ data.position.on_ }} <b>{{ new Date(pos.unlockAt).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</b></span>
                <span>{{ data.position.earned }} <b class="num">{{ qty(rewardsOf(pos), P(pos.product)) }}</b></span>
              </template>
              <span v-else-if="pos.status === 'withdrawable'">{{ data.position.ready }}</span>
            </div>
            <template v-if="pos.status in STEP">
              <div class="stk__steps" aria-hidden="true"><i v-for="(l, i) in data.steps" :key="l" :class="{ 'is-done': i < STEP[pos.status], 'is-now': i === STEP[pos.status] }" /></div>
              <div class="stk__steps-l"><span v-for="(l, i) in data.steps" :key="l" :class="{ 'is-on': i <= STEP[pos.status] }">{{ l }}</span></div>
            </template>
          </div>
          <div class="stk__actions">
            <template v-if="pos.status === 'active'">
              <ZButton variant="ghost" :disabled="off" @click="openStake(pos.product)">{{ data.position.more }}</ZButton>
              <ZButton variant="ghost" :disabled="off" @click="openUnstake(pos.id)">{{ data.position.unstake }}</ZButton>
            </template>
            <ZButton v-else-if="pos.status === 'withdrawable'" @click="withdraw(pos.id)">{{ data.position.withdraw }}</ZButton>
          </div>
        </article>

        <div class="z-panel stk__rewards">
          <div class="stk__toolbar"><span class="label">{{ data.rewardsTable.title }}</span><span class="label">{{ data.rewardsTable.period }}</span></div>
          <div class="stk__table" tabindex="0" role="region" :aria-label="data.rewardsTable.title">
            <table>
              <thead><tr><th scope="col">{{ data.rewardsTable.date }}</th><th scope="col">{{ data.rewardsTable.asset }}</th><th scope="col" class="r">{{ data.rewardsTable.gross }}</th><th scope="col" class="r">{{ data.rewardsTable.fee }}</th><th scope="col" class="r">{{ data.rewardsTable.net }}</th><th scope="col" class="r">{{ data.rewardsTable.value }}</th></tr></thead>
              <tbody>
                <tr v-for="r in rewardRows" :key="r.key">
                  <td>{{ r.d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) }}</td>
                  <td><b>{{ coin(r.p).ticker }}</b></td>
                  <td class="r num">{{ fmt.num(r.gross, 0, r.p.dec + 2) }}</td>
                  <td class="r num">− {{ fmt.num(r.fee, 0, r.p.dec + 2) }}</td>
                  <td class="r num"><b>{{ fmt.num(r.net, 0, r.p.dec + 2) }}</b></td>
                  <td class="r num">{{ fmt.money(r.net * price(r.p)) }}</td>
                </tr>
                <tr v-if="!rewardRows.length"><td colspan="6" class="stk__none">{{ data.rewardsTable.empty }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <div class="stk__dev">
      <span class="label">{{ data.dev.label }}</span>
      <label>{{ data.dev.status }}
        <select v-model="ui.provider" class="stk__select"><option v-for="(l, k) in data.dev.statuses" :key="k" :value="k">{{ l }}</option></select>
      </label>
      <button type="button" class="z-chip" @click="reset">{{ data.dev.reset }}</button>
      <span>{{ data.dev.note }}</span>
    </div>

    <!-- Fenêtre : staker -->
    <ZDialog v-if="stake.open" :title="t(data.stake.title, { name: coin(sp).name })" :close-label="data.stake.cancel" @close="stake.open = false">
      <p class="label">{{ data.stake.label }}</p>
      <label class="stk__amount">
        <span class="sr-only">{{ data.stake.amount }}</span>
        <input v-model="stake.amount" inputmode="decimal" autocomplete="off" placeholder="0" class="num" @input="stake.error = ''" />
        <button type="button" class="stk__max" @click="setPct(100)">{{ data.stake.max }}</button>
        <span class="stk__ccy">{{ coin(sp).ticker }}</span>
      </label>
      <div class="stk__sub"><span>{{ t(data.stake.available, { v: qty(db.balances[sp.id] || 0, sp) }) }}</span><span v-if="sAmount">≈ {{ fmt.money(sAmount * price(sp)) }}</span></div>
      <div class="stk__pcts"><button v-for="v in [25, 50, 75, 100]" :key="v" type="button" class="z-chip" @click="setPct(v)">{{ v === 100 ? data.stake.max : `${v} %` }}</button></div>
      <div class="stk__est">
        <div v-for="[k, d] in [['perDay', 1], ['perMonth', 30], ['perYear', 365]]" :key="k">
          <span>{{ data.stake[k] }}</span>
          <b class="num">{{ sAmount ? `+${fmt.num(est(d), 0, sp.dec)}` : '—' }}</b>
          <small>{{ sAmount ? `≈ ${fmt.money(est(d) * price(sp))}` : coin(sp).ticker }}</small>
        </div>
      </div>
      <div v-if="sp.compound" class="stk__toggle">
        <div><b>{{ data.stake.compound }}</b><small>{{ data.stake.compoundText }}</small></div>
        <button type="button" role="switch" class="stk__switch" :aria-checked="stake.compound" :aria-label="data.stake.compound" @click="stake.compound = !stake.compound" />
      </div>
      <dl class="stk__rows">
        <div><dt>{{ data.stake.rows.apy }}</dt><dd>{{ t(data.stake.rows.apyValue, { net: pct(netApy(sp)), gross: pct(sp.grossApy) }) }}</dd></div>
        <div><dt>{{ data.stake.rows.fee }}</dt><dd>{{ t(data.stake.rows.feeValue, { v: `${fmt.num(CFG.commission * 100)} %` }) }}</dd></div>
        <div><dt>{{ data.stake.rows.activation }}</dt><dd>{{ L(sp).activation }}</dd></div>
        <div><dt>{{ data.stake.rows.unbond }}</dt><dd>{{ L(sp).unbond }}</dd></div>
        <div><dt>{{ data.stake.rows.payout }}</dt><dd>{{ L(sp).payout }}</dd></div>
        <div><dt>{{ data.stake.rows.provider }}</dt><dd>{{ data.stake.rows.providerValue }}</dd></div>
      </dl>
      <label class="stk__check"><input v-model="stake.accept" type="checkbox" /> <span>{{ data.stake.accept }}</span></label>
      <p v-if="sErr" class="z-error" role="alert">{{ sErr }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="stake.open = false">{{ data.stake.cancel }}</ZButton>
        <ZButton :disabled="!sAmount || !!sErr || !stake.accept || stake.busy" @click="confirmStake">{{ stake.busy ? data.stake.sending : data.stake.confirm }}</ZButton>
      </template>
    </ZDialog>

    <!-- Fenêtre : retirer -->
    <ZDialog v-if="un.open && upos" :title="t(data.unstake.title, { asset: coin(up).ticker })" :close-label="data.unstake.cancel" @close="un.open = false">
      <p class="label">{{ data.unstake.label }}</p>
      <label class="stk__amount">
        <span class="sr-only">{{ data.unstake.amount }}</span>
        <input v-model="un.amount" inputmode="decimal" autocomplete="off" placeholder="0" class="num" @input="un.error = ''" />
        <button type="button" class="stk__max" @click="un.amount = String(upos.amount)">{{ data.stake.max }}</button>
        <span class="stk__ccy">{{ coin(up).ticker }}</span>
      </label>
      <div class="stk__sub"><span>{{ t(data.unstake.staked, { v: qty(upos.amount, up) }) }}</span><span v-if="uAmount">≈ {{ fmt.money(uAmount * price(up)) }}</span></div>
      <p class="stk__note"><ZIcon name="alert" :size="16" /> <span>{{ t(data.unstake.note, { when: L(up).unbond }) }}</span></p>
      <p v-if="uErr" class="z-error" role="alert">{{ uErr }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="un.open = false">{{ data.unstake.cancel }}</ZButton>
        <ZButton :disabled="!uAmount || !!uErr || un.busy" @click="confirmUnstake">{{ un.busy ? data.unstake.sending : data.unstake.confirm }}</ZButton>
      </template>
    </ZDialog>
  </div>
</template>

<style scoped>
.stk { display: grid; gap: 16px; }
.stk__bar { display: flex; justify-content: flex-end; }
.stk__tabs { width: auto; }
.stk__tabs button { padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; }
.stk__count { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--gradient-brand); color: var(--color-on-brand); font-size: 10px; }
.stk__banner { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--radius-md); font-size: 13px; line-height: 1.5; --tone: var(--color-state-warn); color: var(--color-text-default); background: color-mix(in srgb, var(--tone) 9%, transparent); border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent); }
.stk__banner.is-maintenance { --tone: var(--color-state-down); }
.stk__banner :deep(svg) { flex: none; margin-top: 2px; color: var(--tone); }
.stk__banner strong { display: block; }
.stk__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stk__kpi { display: grid; gap: 6px; padding: 16px 18px; }
.stk__kpi b { font-size: 20px; font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; }
.stk__kpi small { font-size: 12px; color: var(--color-text-dim); }
.is-up { color: var(--color-state-up); }
.stk__toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.stk__toolbar .label { color: var(--color-text-dim); }
.stk__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.stk__products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.stk__product { display: flex; flex-direction: column; gap: 16px; padding: 22px; transition: border-color var(--motion-duration-hover); }
.stk__product:hover { border-color: var(--color-line-strong); }
.stk__ptop { display: flex; align-items: center; gap: 12px; }
.stk__pname { flex: 1; min-width: 0; display: grid; }
.stk__pname strong { font-size: 15px; font-weight: var(--font-weight-semibold); }
.stk__pname small { font-size: 12px; color: var(--color-text-dim); }
.stk__apy { display: grid; text-align: right; }
.stk__apy strong { font-size: 26px; font-weight: var(--font-weight-semibold); letter-spacing: -0.04em; line-height: 1; background: var(--gradient-brand-soft); -webkit-background-clip: text; background-clip: text; color: transparent; }
.stk__apy small { margin-top: 4px; font-size: 10.5px; color: var(--color-text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
.stk__facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
.stk__facts div { padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.stk__facts dt { font-size: 11px; color: var(--color-text-dim); }
.stk__facts dd { margin: 3px 0 0; font-size: 12.5px; font-weight: var(--font-weight-semibold); }
.stk__pfoot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; }
.stk__pfoot small { font-size: 12px; color: var(--color-text-muted); }
.stk__pfoot b { color: var(--color-text-default); }
.stk__disclaimer { margin-top: 14px; font-size: 11.5px; line-height: 1.55; color: var(--color-text-dim); }
.stk__empty { display: grid; justify-items: center; gap: 6px; padding: 50px 20px; text-align: center; color: var(--color-text-muted); grid-column: 1 / -1; }
.stk__empty :deep(svg) { color: var(--color-brand-primary-300); }
.stk__empty strong { margin-top: 8px; font-size: 16px; color: var(--color-text-default); }
.stk__empty :deep(.z-btn) { margin-top: 14px; }
.stk__positions { display: grid; gap: 12px; }
.stk__pos { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 20px 22px; }
.stk__ptitle { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 15px; font-weight: var(--font-weight-semibold); }
.stk__approx { font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-text-dim); }
.stk__status, .stk__demo { padding: 4px 8px; border-radius: var(--radius-pill); font-size: 9.5px; font-weight: var(--font-weight-semibold); letter-spacing: 0.12em; text-transform: uppercase; --tone: var(--color-brand-secondary-300); color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); }
.stk__status.is-active { --tone: var(--color-state-up); }
.stk__status.is-unbonding { --tone: var(--color-state-warn); }
.stk__status.is-withdrawable { --tone: var(--color-brand-primary-300); }
.stk__status.is-failed { --tone: var(--color-state-down); }
.stk__demo { color: var(--color-text-dim); background: none; border: 1px dashed var(--color-line-strong); }
.stk__meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 8px; font-size: 12px; color: var(--color-text-muted); }
.stk__meta b { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.stk__meta b.is-up { color: var(--color-state-up); }
.stk__steps { display: flex; gap: 6px; max-width: 440px; margin-top: 12px; }
.stk__steps i { position: relative; flex: 1; height: 4px; overflow: hidden; border-radius: 2px; background: var(--color-bg-surface-2); }
.stk__steps i.is-done { background: var(--gradient-brand-soft); }
.stk__steps i.is-now::after { content: ''; position: absolute; inset: 0; background: var(--gradient-brand-soft); animation: stk-pulse 1.4s ease-in-out infinite; }
@keyframes stk-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
.stk__steps-l { display: flex; gap: 6px; max-width: 440px; margin-top: 6px; }
.stk__steps-l span { flex: 1; font-size: 10.5px; color: var(--color-text-dim); }
.stk__steps-l span.is-on { color: var(--color-text-default); }
.stk__actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.stk__rewards { padding: 20px 22px; }
.stk__table { overflow-x: auto; }
.stk__table table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 12.5px; }
.stk__table th { padding: 10px 8px; text-align: left; font-size: 10.5px; font-weight: var(--font-weight-semibold); letter-spacing: var(--font-tracking-label); text-transform: uppercase; color: var(--color-text-dim); border-bottom: 1px solid var(--color-line-default); }
.stk__table td { padding: 11px 8px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-line-default); }
.stk__table tr:last-child td { border-bottom: 0; }
.stk__table b { color: var(--color-text-default); }
.stk__table .r { text-align: right; }
.stk__none { padding: 24px !important; text-align: center; }
.stk__dev { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius-md); border: 1px dashed var(--color-line-strong); font-size: 12px; color: var(--color-text-dim); }
.stk__dev label { display: inline-flex; align-items: center; gap: 8px; }
.stk__select { height: 32px; padding: 0 10px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-default); font: inherit; font-size: 12px; }
/* Fenêtres */
.stk__amount { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover); }
.stk__amount:focus-within { border-color: var(--color-brand-secondary-300); }
.stk__amount input { flex: 1; min-width: 0; padding: 0; background: none; border: 0; outline: none; font: inherit; font-size: 24px; font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; color: var(--color-text-default); }
.stk__max { padding: 6px 9px; border-radius: var(--radius-sm); font-size: 10.5px; font-weight: var(--font-weight-semibold); letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary-300) 12%, transparent); }
.stk__ccy { padding: 6px 10px; border-radius: var(--radius-pill); background: var(--fill-2); font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-text-muted); }
.stk__sub { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--color-text-dim); }
.stk__pcts { display: flex; gap: 6px; margin-top: 10px; }
.stk__pcts .z-chip { flex: 1; justify-content: center; }
.stk__est { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.stk__est div { display: grid; gap: 4px; padding: 10px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.stk__est span { font-size: 10.5px; font-weight: var(--font-weight-semibold); letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-dim); }
.stk__est b { font-size: 13px; }
.stk__est small { font-size: 11px; color: var(--color-text-dim); }
.stk__toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0 4px; }
.stk__toggle b { display: block; font-size: 13px; }
.stk__toggle small { font-size: 12px; color: var(--color-text-dim); }
.stk__switch { position: relative; flex: none; width: 38px; height: 22px; border-radius: 11px; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); transition: background-color var(--motion-duration-hover); }
.stk__switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--color-paper); box-shadow: 0 1px 3px color-mix(in srgb, var(--color-paper-ink) 30%, transparent); transition: transform var(--duration-panel) var(--motion-ease-out); }
.stk__switch[aria-checked='true'] { background: var(--gradient-brand); border-color: transparent; }
.stk__switch[aria-checked='true']::after { transform: translateX(16px); }
.stk__rows { display: grid; margin: 12px 0 0; }
.stk__rows div { display: flex; justify-content: space-between; gap: 14px; padding: 8px 0; font-size: 13px; }
.stk__rows dt { color: var(--color-text-muted); }
.stk__rows dd { margin: 0; text-align: right; font-weight: var(--font-weight-semibold); }
.stk__check { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; font-size: 12px; line-height: 1.5; color: var(--color-text-muted); cursor: pointer; }
.stk__check input { margin-top: 2px; accent-color: var(--color-brand-primary); }
.stk__note { display: flex; gap: 10px; margin-top: 14px; padding: 12px 14px; border-radius: var(--radius-md); font-size: 12px; line-height: 1.5; color: var(--color-text-muted); background: color-mix(in srgb, var(--color-state-warn) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-state-warn) 30%, transparent); }
.stk__note :deep(svg) { flex: none; margin-top: 1px; color: var(--color-state-warn); }
@media (max-width: 860px) { .stk__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .stk__products { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 720px) { .stk__pos { grid-template-columns: auto minmax(0, 1fr); } .stk__actions { grid-column: 1 / -1; justify-content: flex-start; } }
@media (max-width: 520px) { .stk__bar { justify-content: stretch; } .stk__tabs { width: 100%; } .stk__product { padding: 18px; } }
@media (prefers-reduced-motion: reduce) { .stk__steps i.is-now::after { animation: none; opacity: 1; } }
</style>
