<script setup>
import { computed, ref, watch } from 'vue';
import { slippageOptions, swapFee } from '../../content/data.js';
import { priceDecimals, useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { useWallet } from '../../composables/useWallet.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';

// Convertir une crypto en une autre, au cours du flux, frais déduits.
const props = defineProps({
  data: { type: Object, required: true }, // pages.convert.widget
  common: { type: Object, required: true },
});
const emit = defineEmits(['step']);
const { fmt, t } = useI18n();
const feed = useMarketFeed();
const { balanceOf, demo } = useWallet();

const params = new URLSearchParams(window.location.search);
const known = (id) => props.common.coins.some((c) => c.id === id);
const from = ref(known(params.get('from')) ? params.get('from') : 'btc');
const to = ref(known(params.get('to')) && params.get('to') !== from.value ? params.get('to') : 'usdt');
const amount = ref('');
const slippage = ref(slippageOptions[0]);
const customOpen = ref(false);
const custom = ref('');
const notice = ref('');
const touched = ref({ any: false, to: false });

const coin = (id) => feed.coins.find((c) => c.id === id);
const fromCoin = computed(() => coin(from.value));
const toCoin = computed(() => coin(to.value));
const qtyDec = (c) => Math.min(8, Math.max(2, Math.ceil(Math.log10(c.price)) - 1));

const rate = computed(() => fromCoin.value.price / toCoin.value.price);
const value = computed(() => fmt.parse(amount.value));
const valid = computed(() => Number.isFinite(value.value) && value.value > 0);
const gross = computed(() => (valid.value ? value.value * rate.value : 0));
const fee = computed(() => gross.value * swapFee);
const receive = computed(() => gross.value - fee.value);
const minReceived = computed(() => receive.value * (1 - slippage.value / 100));
const balance = computed(() => balanceOf(from.value));
const insufficient = computed(() => valid.value && value.value > balance.value);

const ctaState = computed(() => (!valid.value ? 'empty' : insufficient.value ? 'insufficient' : 'ready'));
const ctaLabel = computed(() => t(props.data.cta[ctaState.value], { from: fromCoin.value.ticker, to: toCoin.value.ticker }));

const options = computed(() => feed.coins.map((c) => ({ value: c.id, label: c.name, short: c.ticker, glyph: c.glyph, tone: c.tone, sub: c.ticker, keywords: c.ticker })));

// Choisir la même crypto des deux côtés inverse la paire.
watch(from, (v, old) => {
  touched.value.any = true;
  if (v === to.value) to.value = old;
});
watch(to, (v, old) => {
  touched.value.to = true;
  if (v === from.value) from.value = old;
});
function flip() {
  [from.value, to.value] = [to.value, from.value];
}
function setMax() {
  touched.value.any = true;
  amount.value = fmt.num(balance.value, 0, qtyDec(fromCoin.value));
}
function setCustom() {
  const v = fmt.parse(custom.value);
  if (Number.isFinite(v) && v > 0 && v <= 50) slippage.value = v;
}

const step = computed(() => (!touched.value.any ? 0 : !valid.value ? 1 : !touched.value.to ? 2 : 3));
watch(step, (s) => emit('step', s), { immediate: true });

function onSubmit(e) {
  e.preventDefault();
  if (ctaState.value !== 'ready') return;
  if (props.common.links.convertAction === '#') notice.value = props.data.demo;
  else e.target.submit();
}
</script>

<template>
  <form class="cv" :action="common.links.convertAction" method="post" :aria-label="data.label" novalidate @submit="onSubmit">
    <div class="cv__card">
      <div class="cv__row">
        <span class="cv__label">{{ data.pay }}</span>
        <span class="cv__avail">{{ data.available }} <strong class="num">{{ fmt.num(balance, 0, qtyDec(fromCoin)) }} {{ fromCoin.ticker }}</strong></span>
      </div>
      <div class="cv__row cv__row--main">
        <ZSelect v-model="from" variant="plain" class="cv__coin" :options="options" :label="data.from" searchable :search-label="data.search" :empty="data.empty" />
        <label class="sr-only" for="cv-amount">{{ data.pay }} ({{ fromCoin.ticker }})</label>
        <input
          id="cv-amount"
          v-model="amount"
          name="amount"
          class="cv__input num"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0,00"
          :aria-invalid="insufficient"
          @input="touched.any = true"
        />
      </div>
      <div class="cv__row cv__row--end">
        <span v-if="insufficient" class="cv__err">{{ data.cta.insufficient }}</span>
        <button type="button" class="cv__max" @click="setMax">{{ data.max }}</button>
      </div>
    </div>

    <button type="button" class="cv__flip" :aria-label="data.switch" @click="flip"><ZIcon name="swap-v" :size="18" /></button>

    <div class="cv__card">
      <div class="cv__row">
        <span class="cv__label">{{ data.get }}</span>
        <span class="cv__avail">{{ data.available }} <strong class="num">{{ fmt.num(balanceOf(to), 0, qtyDec(toCoin)) }} {{ toCoin.ticker }}</strong></span>
      </div>
      <div class="cv__row cv__row--main">
        <ZSelect v-model="to" variant="plain" class="cv__coin" :options="options" :label="data.to" searchable :search-label="data.search" :empty="data.empty" />
        <output class="cv__input cv__output num" aria-live="polite">{{ valid ? fmt.num(receive, 0, qtyDec(toCoin)) : '0,00' }}</output>
      </div>
    </div>

    <dl class="cv__details">
      <div><dt>{{ data.price }}</dt><dd class="num">1 {{ fromCoin.ticker }} ≈ {{ fmt.num(rate, priceDecimals(rate)) }} {{ toCoin.ticker }}</dd></div>
      <div><dt>{{ t(data.fee, { rate: fmt.pct(swapFee * 100).replace(/^\+/, '') }) }}</dt><dd class="num">{{ valid ? `${fmt.num(fee, 0, qtyDec(toCoin))} ${toCoin.ticker}` : '—' }}</dd></div>
      <div><dt>{{ data.networkFee }}</dt><dd>{{ data.networkFeeValue }}</dd></div>
      <div class="cv__slip">
        <dt :title="data.slippageHint">{{ data.slippage }}</dt>
        <dd>
          <div class="cv__slips" role="group" :aria-label="data.slippage">
            <button v-for="s in slippageOptions" :key="s" type="button" :aria-pressed="slippage === s && !customOpen" @click="slippage = s; customOpen = false">
              {{ fmt.num(s, 1) }} %
            </button>
            <button type="button" :aria-pressed="customOpen" :aria-expanded="customOpen" @click="customOpen = !customOpen">{{ data.custom }}</button>
          </div>
          <label v-if="customOpen" class="cv__custom">
            <span class="sr-only">{{ data.customLabel }}</span>
            <input v-model="custom" inputmode="decimal" placeholder="0,5" @input="setCustom" />
            <span>%</span>
          </label>
        </dd>
      </div>
      <div><dt>{{ data.minReceived }}</dt><dd class="num">{{ valid ? `${fmt.num(minReceived, 0, qtyDec(toCoin))} ${toCoin.ticker}` : '—' }}</dd></div>
      <div class="cv__total"><dt>{{ data.receive }}</dt><dd class="num">{{ valid ? `${fmt.num(receive, 0, qtyDec(toCoin))} ${toCoin.ticker}` : '—' }}</dd></div>
    </dl>

    <ZButton type="submit" size="lg" class="cv__cta" :class="{ 'is-off': ctaState !== 'ready' }" :aria-disabled="ctaState !== 'ready'">{{ ctaLabel }}</ZButton>
    <p v-if="notice" class="z-notice" role="status">{{ notice }}</p>
    <p v-if="demo" class="cv__note">{{ data.balancesNote }}</p>
  </form>
</template>

<style scoped>
.cv { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.cv__card { display: grid; gap: 10px; padding: 18px 20px; border-radius: var(--radius-lg); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover); }
.cv__card:focus-within { border-color: var(--color-line-strong); }
.cv__row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 12px; }
.cv__row--main { flex-wrap: nowrap; }
.cv__row--end { justify-content: flex-end; }
.cv__label { font-size: 14px; color: var(--color-text-muted); }
.cv__avail { font-size: 13px; color: var(--color-text-muted); }
.cv__avail strong { color: var(--color-text-default); font-weight: var(--font-weight-medium); }
.cv__coin :deep(.zs__btn) { font-size: 20px; font-weight: var(--font-weight-semibold); gap: 10px; }
.cv__coin :deep(.z-coin-icon) { --s: 30px !important; }
.cv__input { flex: 1; width: 0; min-width: 0; height: 44px; background: none; border: 0; outline: none; text-align: right; font-size: 28px; font-weight: var(--font-weight-medium); letter-spacing: -0.02em; }
.cv__input::placeholder { color: var(--color-text-dim); }
.cv__input[aria-invalid='true'] { color: var(--color-state-down); }
.cv__output { display: flex; align-items: center; justify-content: flex-end; color: var(--color-text-muted); overflow: hidden; }
.cv__max { font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); }
.cv__max:hover { color: var(--color-text-default); }
.cv__err { margin-right: auto; font-size: var(--font-size-small); color: var(--color-state-down); }
.cv__flip {
  justify-self: center; display: grid; place-items: center; width: 44px; height: 44px; margin: -26px 0; z-index: 1; border-radius: 50%;
  background: var(--color-bg-surface-2); border: 4px solid var(--color-bg-base); color: var(--color-text-default);
  transition: transform var(--duration-panel) var(--motion-ease-out), background-color var(--motion-duration-hover);
}
.cv__flip:hover { transform: rotate(180deg); background: var(--fill-2); }
.cv__details { display: grid; gap: 12px; margin: 8px 0 0; padding: 18px 20px; border-radius: var(--radius-lg); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); font-size: 13px; }
.cv__details > div { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.cv__details dt { color: var(--color-text-muted); }
.cv__details dd { margin: 0; text-align: right; }
.cv__slip dt { text-decoration: underline dotted var(--color-text-dim); text-underline-offset: 3px; cursor: help; }
.cv__slip dd { display: grid; justify-items: end; gap: 8px; }
.cv__slips { display: flex; gap: 6px; }
.cv__slips button { height: 28px; padding: 0 10px; border-radius: var(--radius-sm); border: 1px solid var(--color-line-strong); font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-text-muted); }
.cv__slips button[aria-pressed='true'] { color: var(--color-text-default); border-color: var(--color-brand-secondary-300); background: color-mix(in srgb, var(--color-brand-secondary) 22%, transparent); }
.cv__custom { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: var(--radius-sm); background: var(--fill-1); border: 1px solid var(--color-line-strong); }
.cv__custom input { width: 48px; background: none; border: 0; outline: none; text-align: right; font-size: 13px; }
.cv__total { padding-top: 12px; border-top: 1px solid var(--color-line-default); }
.cv__total dt { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.cv__total dd { color: var(--color-state-up); font-weight: var(--font-weight-semibold); }
.cv__cta { width: 100%; height: 54px; margin-top: 12px; border-radius: var(--radius-pill); font-size: 12px; }
.cv__cta.is-off { filter: saturate(0.2); opacity: 0.55; cursor: not-allowed; }
.cv__note { font-size: var(--font-size-small); color: var(--color-text-dim); text-align: center; }
</style>
