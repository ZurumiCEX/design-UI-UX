<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useWallet } from '../../composables/useWallet.js';
import ZButton from '../ui/ZButton.vue';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';

// Fenêtre de vente P2P : montant → XOF reçus, numéro Mobile Money, confirmation.
const props = defineProps({
  offer: { type: Object, required: true },
  coin: { type: Object, required: true }, // USDT ou USDC
  data: { type: Object, required: true }, // pages.p2p.sheet
  common: { type: Object, required: true },
});
const emit = defineEmits(['close']);
const { fmt, t } = useI18n();
const { balanceOf, demo } = useWallet();

const price = computed(() => props.offer.price[props.coin.id]);
const methods = computed(() => props.common.paymentMethods.filter((m) => props.offer.methods.includes(m.id)));
const form = reactive({ amount: '', method: props.offer.methods[0], country: props.common.defaultCountry, account: '', name: '', confirm: false });
const errors = reactive({});
const created = ref(false);
const notice = ref('');
const dialog = ref(null);
const firstField = ref(null);
let lastFocus = null;

const value = computed(() => fmt.parse(form.amount));
const xof = computed(() => (Number.isFinite(value.value) ? Math.floor(value.value * price.value) : 0));
const balance = computed(() => Math.min(balanceOf(props.coin.id), props.offer.available[props.coin.id]));
const method = computed(() => methods.value.find((m) => m.id === form.method));
const countryOptions = computed(() => props.common.countries.map((c) => ({ value: c.id, label: c.name, short: c.dial, sub: c.dial })));
const methodOptions = computed(() => methods.value.map((m) => ({ value: m.id, label: m.name, glyph: m.glyph, tone: m.tone })));

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = props.data.errors;
  if (!Number.isFinite(value.value) || value.value <= 0) errors.amount = e.amount;
  else if (xof.value < props.offer.limits.min) errors.amount = t(e.min, { v: fmt.xof(props.offer.limits.min) });
  else if (xof.value > props.offer.limits.max) errors.amount = t(e.max, { v: fmt.xof(props.offer.limits.max) });
  else if (value.value > balanceOf(props.coin.id)) errors.amount = e.balance;
  if (!/^\d{8,10}$/.test(form.account.replace(/[\s.-]/g, ''))) errors.account = e.account;
  if (form.name.trim().length < 2) errors.name = e.name;
  if (!form.confirm) errors.confirm = e.confirm;
  return !Object.keys(errors).length;
}

// Après une première tentative, les erreurs se mettent à jour pendant la saisie.
const attempted = ref(false);
watch(form, () => attempted.value && validate());

function onSubmit(e) {
  e.preventDefault();
  attempted.value = true;
  if (!validate()) return dialog.value.querySelector('[aria-invalid="true"]')?.focus();
  if (props.common.links.p2pAction === '#') {
    created.value = true;
    notice.value = props.data.demo;
    nextTick(() => dialog.value.querySelector('.ss__done-title')?.focus());
  } else e.target.submit();
}

// Fenêtre modale : focus piégé, Échap pour fermer, retour du focus au déclencheur.
function onKey(e) {
  if (e.key === 'Escape') return emit('close');
  if (e.key !== 'Tab') return;
  const items = [...dialog.value.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.offsetParent);
  if (!items.length) return;
  const [first, last] = [items[0], items[items.length - 1]];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
onMounted(() => {
  lastFocus = document.activeElement;
  document.body.style.overflow = 'hidden';
  nextTick(() => firstField.value?.focus());
});
onBeforeUnmount(() => {
  document.body.style.overflow = '';
  lastFocus?.focus?.();
});
</script>

<template>
  <Teleport to="body">
    <div class="ss" @keydown="onKey">
      <div class="ss__scrim" aria-hidden="true" @click="emit('close')" />
      <div ref="dialog" class="ss__panel" role="dialog" aria-modal="true" aria-labelledby="ss-title">
        <header class="ss__head">
          <h2 id="ss-title">{{ t(data.title, { coin: coin.ticker, merchant: offer.merchant }) }}</h2>
          <button type="button" class="ss__close" :aria-label="data.close" @click="emit('close')"><ZIcon name="close" :size="18" /></button>
        </header>

        <form v-if="!created" class="ss__form" novalidate @submit="onSubmit">
          <p class="ss__price">{{ data.price }} <strong class="num">1 {{ coin.ticker }} = {{ fmt.xof(price) }}</strong></p>

          <div class="ss__field" :class="{ 'is-invalid': errors.amount }">
            <label for="ss-amount">{{ data.amount }}</label>
            <div class="ss__line">
              <input id="ss-amount" ref="firstField" v-model="form.amount" class="num" inputmode="decimal" autocomplete="off" placeholder="0,00" :aria-invalid="!!errors.amount" :aria-describedby="errors.amount ? 'ss-amount-err' : 'ss-amount-hint'" />
              <span class="ss__unit"><ZCoinIcon :glyph="coin.glyph" :tone="coin.tone" :size="20" /> {{ coin.ticker }}</span>
              <button type="button" class="ss__max" @click="form.amount = fmt.num(balance, 0, 2)">{{ data.max }}</button>
            </div>
          </div>
          <p v-if="errors.amount" id="ss-amount-err" class="z-error">{{ errors.amount }}</p>
          <p v-else id="ss-amount-hint" class="z-hint num">
            {{ t(data.available, { v: `${fmt.num(balanceOf(coin.id), 2)} ${coin.ticker}` }) }} · {{ t(data.limits, { min: fmt.xof(offer.limits.min), max: fmt.xof(offer.limits.max) }) }}
          </p>

          <div class="ss__receive">
            <span>{{ data.receive }}</span>
            <strong class="num" aria-live="polite">{{ fmt.xof(xof) }}</strong>
          </div>

          <span class="ss__label">{{ data.method }}</span>
          <ZSelect v-model="form.method" variant="field" :options="methodOptions" :label="data.method" />

          <label class="ss__label" for="ss-account">{{ t(data.account, { method: method?.name }) }}</label>
          <div class="ss__phone">
            <ZSelect v-model="form.country" variant="field" :options="countryOptions" :label="data.country" />
            <input id="ss-account" v-model="form.account" class="z-input" type="tel" inputmode="numeric" autocomplete="tel-national" :placeholder="data.accountPlaceholder" :aria-invalid="!!errors.account" :aria-describedby="errors.account ? 'ss-account-err' : undefined" />
          </div>
          <p v-if="errors.account" id="ss-account-err" class="z-error">{{ errors.account }}</p>

          <label class="ss__label" for="ss-name">{{ data.name }}</label>
          <input id="ss-name" v-model="form.name" class="z-input" autocomplete="name" :placeholder="data.namePlaceholder" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'ss-name-err' : undefined" />
          <p v-if="errors.name" id="ss-name-err" class="z-error">{{ errors.name }}</p>

          <label class="ss__check">
            <input v-model="form.confirm" type="checkbox" :aria-invalid="!!errors.confirm" />
            <span class="ss__box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
            <span>{{ data.confirm }}</span>
          </label>
          <p v-if="errors.confirm" class="z-error">{{ errors.confirm }}</p>

          <ZButton type="submit" size="lg" class="ss__cta">{{ t(data.cta, { coin: coin.ticker }) }}</ZButton>
          <p v-if="demo" class="ss__demo">{{ data.balancesNote }}</p>
        </form>

        <div v-else class="ss__done">
          <span class="ss__done-icon" aria-hidden="true"><ZIcon name="check" :size="24" /></span>
          <h3 class="ss__done-title" tabindex="-1">{{ data.created.title }}</h3>
          <p class="num">{{ t(data.created.text, { amount: `${form.amount} ${coin.ticker}`, xof: fmt.xof(xof), method: method?.name }) }}</p>
          <ol class="ss__timeline">
            <li v-for="(s, i) in data.created.steps" :key="s" :class="{ 'is-active': i === 0 }">
              <span class="num">{{ i + 1 }}</span> {{ s }}
            </li>
          </ol>
          <p class="z-notice" role="status">{{ notice }}</p>
          <ZButton variant="ghost" size="lg" class="ss__cta" @click="emit('close')">{{ data.close }}</ZButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ss { position: fixed; inset: 0; z-index: 100; display: grid; justify-items: end; }
.ss__scrim { position: absolute; inset: 0; background: color-mix(in srgb, var(--color-bg-base) 72%, transparent); backdrop-filter: blur(4px); animation: ss-fade var(--duration-panel) var(--motion-ease-out); }
.ss__panel {
  position: relative; width: min(460px, 100%); height: 100%; overflow-y: auto; overscroll-behavior: contain;
  background: var(--color-bg-surface); border-left: 1px solid var(--color-line-strong); box-shadow: -40px 0 80px -30px var(--ink);
  animation: ss-in var(--motion-duration-reveal) var(--motion-ease-out);
}
@keyframes ss-in { from { transform: translateX(40px); opacity: 0; } }
@keyframes ss-fade { from { opacity: 0; } }
.ss__head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 24px; background: var(--color-bg-surface); border-bottom: 1px solid var(--color-line-default); }
.ss__head h2 { font-size: 17px; font-weight: var(--font-weight-semibold); letter-spacing: -0.01em; }
.ss__close { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: var(--color-text-muted); }
.ss__close:hover { background: var(--fill-2); color: var(--color-text-default); }
.ss__form, .ss__done { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 24px; }
.ss__price { font-size: 13px; color: var(--color-text-muted); }
.ss__price strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.ss__field { margin-top: 8px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-strong); }
.ss__field:focus-within { border-color: var(--color-brand-secondary-300); }
.ss__field.is-invalid { border-color: var(--color-state-down); }
.ss__field label { font-size: var(--font-size-small); color: var(--color-text-muted); }
.ss__line { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.ss__line input { flex: 1; width: 0; min-width: 0; height: 36px; background: none; border: 0; outline: none; font-size: 22px; font-weight: var(--font-weight-semibold); }
.ss__unit { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: var(--font-weight-semibold); }
.ss__max { font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); }
.ss__receive { display: flex; justify-content: space-between; align-items: baseline; margin: 10px 0 6px; padding: 14px 16px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-state-up) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-state-up) 30%, transparent); font-size: 13px; color: var(--color-text-muted); }
.ss__receive strong { font-size: 20px; color: var(--color-state-up); }
.ss__label { display: block; margin-top: 10px; font-size: var(--font-size-small); color: var(--color-text-muted); }
.ss__phone { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; }
.ss__check { position: relative; display: flex; gap: 10px; margin-top: 12px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.ss__check input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.ss__box { display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 5px; border: 1px solid var(--color-text-dim); color: transparent; }
.ss__check input:checked + .ss__box { background: var(--gradient-brand); border-color: transparent; color: var(--color-text-default); }
.ss__check input:focus-visible + .ss__box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.ss__check input[aria-invalid='true'] + .ss__box { border-color: var(--color-state-down); }
.ss__cta { width: 100%; height: 50px; margin-top: 14px; }
.ss__demo { font-size: var(--font-size-small); color: var(--color-text-dim); text-align: center; }
.ss__done { text-align: center; justify-items: center; }
.ss__done-icon { display: grid; place-items: center; width: 56px; height: 56px; margin-top: 12px; border-radius: 50%; background: var(--gradient-brand); box-shadow: 0 0 50px -10px var(--glow-brand); }
.ss__done-title { margin-top: 8px; font-size: 22px; font-weight: var(--font-weight-semibold); }
.ss__done-title:focus { outline: none; }
.ss__done > p { font-size: 14px; color: var(--color-text-muted); }
.ss__timeline { display: grid; gap: 8px; width: 100%; margin: 12px 0; text-align: left; }
.ss__timeline li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; color: var(--color-text-muted); }
.ss__timeline li.is-active { color: var(--color-text-default); border: 1px solid var(--color-brand-primary-300); }
.ss__timeline span { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--color-line-strong); font-size: 11px; }
.ss__timeline li.is-active span { background: var(--gradient-brand); border-color: transparent; }
@media (prefers-reduced-motion: reduce) { .ss__panel, .ss__scrim { animation: none; } }
</style>
