<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import ZButton from '../ui/ZButton.vue';
import ZSelect from '../ui/ZSelect.vue';

// Achat / vente rapide : montant en FCFA ⇄ crypto, au cours du flux, payé par Mobile Money.
const props = defineProps({
  data: { type: Object, required: true }, // pages.buy.widget
  common: { type: Object, required: true },
});
const { fmt, t } = useI18n();
const feed = useMarketFeed();

const params = new URLSearchParams(window.location.search);
const mode = ref(params.get('mode') === 'sell' ? 'sell' : 'buy');
const cryptoId = ref(props.common.coins.some((c) => c.id === params.get('crypto')) ? params.get('crypto') : 'usdt');
const method = ref(props.common.paymentMethods[0].id);
const amount = ref(mode.value === 'buy' ? '50000' : '');
const touched = ref(false);
const notice = ref('');

const coin = computed(() => feed.coins.find((c) => c.id === cryptoId.value));
const limits = props.common.buyLimits;

// Décimales d'une quantité de crypto selon son prix (BTC : 7, USDT : 2).
const qtyDecimals = computed(() => Math.min(8, Math.max(2, Math.ceil(Math.log10(coin.value.price)) - 1)));

const value = computed(() => fmt.parse(amount.value));
// Montant en XOF de l'opération, quel que soit le sens.
const xofAmount = computed(() => (mode.value === 'buy' ? value.value : value.value * coin.value.price));
const received = computed(() => {
  if (!Number.isFinite(value.value)) return '';
  return mode.value === 'buy' ? fmt.num(value.value / coin.value.price, qtyDecimals.value) : fmt.num(Math.floor(value.value * coin.value.price), 0);
});

const error = computed(() => {
  if (!touched.value && !amount.value) return '';
  if (!Number.isFinite(value.value) || value.value <= 0) return props.data.errors.invalid;
  if (xofAmount.value < limits.min) return t(props.data.errors.min, { min: fmt.xof(limits.min) });
  if (xofAmount.value > limits.max) return t(props.data.errors.max, { max: fmt.xof(limits.max) });
  return '';
});

const cryptoOptions = computed(() =>
  feed.coins.map((c) => ({ value: c.id, label: c.name, short: c.ticker, glyph: c.glyph, tone: c.tone, sub: c.ticker, keywords: c.ticker })),
);
const methodOptions = computed(() => props.common.paymentMethods.map((m) => ({ value: m.id, label: m.name, glyph: m.glyph, tone: m.tone })));

function setMode(next) {
  if (next === mode.value) return;
  mode.value = next;
  amount.value = '';
  touched.value = false;
  notice.value = '';
}

function onSubmit(e) {
  touched.value = true;
  if (error.value || !amount.value) {
    e.preventDefault();
    return;
  }
  // Route serveur à brancher : sans elle, on affiche un message de démo.
  if (props.common.links.buyAction === '#') {
    e.preventDefault();
    notice.value = props.data.demo;
  }
}
</script>

<template>
  <form class="buy z-panel" :action="common.links.buyAction" method="post" :aria-label="data.label" novalidate @submit="onSubmit">
    <div class="buy__tabs" role="tablist" :aria-label="data.label">
      <button type="button" role="tab" :aria-selected="mode === 'buy'" @click="setMode('buy')">{{ data.tabs.buy }}</button>
      <button type="button" role="tab" :aria-selected="mode === 'sell'" @click="setMode('sell')">{{ data.tabs.sell }}</button>
    </div>

    <div class="buy__body">
      <div class="buy__field" :class="{ 'is-invalid': error }">
        <label class="buy__label" for="buy-amount">{{ data.spend }}</label>
        <input
          id="buy-amount"
          v-model="amount"
          name="amount"
          class="buy__input num"
          inputmode="decimal"
          autocomplete="off"
          :placeholder="mode === 'buy' ? `${fmt.num(limits.min)} – ${fmt.num(limits.max)}` : '0'"
          :aria-invalid="!!error"
          aria-describedby="buy-hint"
          @blur="touched = true"
        />
        <span v-if="mode === 'buy'" class="buy__unit"><span class="buy__flag">F</span> XOF</span>
        <ZSelect v-else v-model="cryptoId" class="buy__unit" :options="cryptoOptions" :label="data.crypto" searchable :search-label="data.cryptoSearch" :empty="data.empty" align="right" />
      </div>

      <div class="buy__field">
        <span class="buy__label" id="buy-receive-label">{{ data.receive }}</span>
        <output class="buy__input buy__output num" aria-labelledby="buy-receive-label" aria-live="polite">{{ received || '0' }}</output>
        <ZSelect v-if="mode === 'buy'" v-model="cryptoId" class="buy__unit" :options="cryptoOptions" :label="data.crypto" searchable :search-label="data.cryptoSearch" :empty="data.empty" align="right" />
        <span v-else class="buy__unit"><span class="buy__flag">F</span> XOF</span>
      </div>

      <p id="buy-hint" :class="error ? 'z-error' : 'z-hint'">
        {{ error || t(data.limits, { min: fmt.xof(limits.min), max: fmt.xof(limits.max) }) }}
      </p>

      <div class="buy__method">
        <span class="buy__method-label">{{ mode === 'buy' ? data.payWith : data.receiveOn }}</span>
        <ZSelect v-model="method" variant="field" :options="methodOptions" :label="mode === 'buy' ? data.payWith : data.receiveOn" />
        <input type="hidden" name="method" :value="method" />
        <input type="hidden" name="crypto" :value="cryptoId" />
        <input type="hidden" name="side" :value="mode" />
      </div>

      <p class="buy__ref">
        {{ data.reference }} : <strong class="num">1 {{ coin.ticker }} ≈ {{ fmt.xof(coin.price) }}</strong>
      </p>

      <ZButton type="submit" size="lg" class="buy__cta">{{ t(data.cta[mode], { ticker: coin.ticker }) }}</ZButton>
      <p v-if="notice" class="z-notice" role="status">{{ notice }}</p>
      <p class="buy__note">{{ data.note }}</p>
    </div>
  </form>
</template>

<style scoped>
.buy { overflow: visible; box-shadow: 0 40px 100px -40px var(--glow-brand); }
.buy__tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--color-line-default); }
.buy__tabs button { position: relative; height: 60px; font-size: 18px; font-weight: var(--font-weight-semibold); letter-spacing: -0.01em; color: var(--color-text-dim); transition: color var(--motion-duration-hover); }
.buy__tabs button:first-child { border-top-left-radius: var(--radius-lg); }
.buy__tabs button:last-child { border-top-right-radius: var(--radius-lg); }
.buy__tabs button[aria-selected='false'] { background: var(--color-bg-surface-2); }
.buy__tabs button[aria-selected='true'] { color: var(--color-text-default); }
.buy__tabs button[aria-selected='true']::after { content: ''; position: absolute; left: 30%; right: 30%; bottom: -1px; height: 2px; background: var(--gradient-brand-soft); border-radius: 2px; }
.buy__tabs button:hover { color: var(--color-text-default); }
.buy__body { display: grid; gap: 14px; padding: 24px; }
.buy__field {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'label label' 'input unit'; align-items: center; column-gap: 12px;
  padding: 12px 12px 12px 16px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-strong);
  transition: border-color var(--motion-duration-hover);
}
.buy__field:focus-within { border-color: var(--color-brand-secondary-300); }
.buy__field.is-invalid { border-color: var(--color-state-down); }
.buy__label { grid-area: label; font-size: var(--font-size-small); color: var(--color-text-muted); }
.buy__input { grid-area: input; min-width: 0; height: 36px; background: none; border: 0; outline: none; font-size: 22px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.buy__input::placeholder { color: var(--color-text-dim); font-weight: var(--font-weight-medium); }
.buy__output { display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-muted); }
.buy__unit { grid-area: unit; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: var(--font-weight-semibold); }
span.buy__unit { height: 36px; padding: 0 12px 0 8px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.buy__flag { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--color-state-up); color: var(--ink); font-size: 10px; font-weight: var(--font-weight-bold); }
.buy__body > .z-error, .buy__body > .z-hint { margin-top: -6px; }
.buy__method { display: grid; gap: 8px; margin-top: 4px; }
.buy__method-label { font-size: 13px; font-weight: var(--font-weight-semibold); }
.buy__ref { font-size: var(--font-size-small); color: var(--color-text-dim); }
.buy__ref strong { color: var(--color-text-muted); font-weight: var(--font-weight-medium); }
.buy__cta { width: 100%; height: 50px; font-size: 12px; }
.buy__note { font-size: var(--font-size-small); color: var(--color-text-dim); text-align: center; }
</style>
