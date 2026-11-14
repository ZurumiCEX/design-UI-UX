<script setup>
import { computed, ref, watch } from 'vue';
import { networks, sendLimitXof } from '../../content/data.js';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { useWallet } from '../../composables/useWallet.js';
import { isValidAddress, isValidRecipient, matchingNetworks } from '../../market/addresses.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';
import StepBlock from './StepBlock.vue';

// Envoyer : crypto → destinataire (adresse externe ou utilisateur Zurumi) → montant et frais.
const props = defineProps({
  data: { type: Object, required: true }, // pages.send.widget
  common: { type: Object, required: true },
});
const emit = defineEmits(['step']);
const { fmt, t } = useI18n();
const feed = useMarketFeed();
const { balanceOf, demo } = useWallet();

const fromUrl = new URLSearchParams(window.location.search).get('crypto');
const coinId = ref(networks[fromUrl] ? fromUrl : 'usdt');
const coin = computed(() => feed.coins.find((c) => c.id === coinId.value));
const nets = computed(() => networks[coinId.value]);
const internal = ref(false);
const address = ref('');
const networkId = ref(null);
const memo = ref('');
const amount = ref('');
const note = ref('');
const bookOpen = ref(false);
const submitted = ref(false);
const notice = ref('');
const touched = ref(false);

const network = computed(() => nets.value.find((n) => n.id === networkId.value) ?? null);
const qtyDec = computed(() => Math.min(8, Math.max(2, Math.ceil(Math.log10(coin.value.price)) - 1)));
const q = (v) => fmt.num(v, 0, qtyDec.value);

watch(coinId, () => {
  touched.value = true;
  networkId.value = nets.value.length === 1 ? nets.value[0].id : null;
  amount.value = '';
});
// Réseau déduit de l'adresse quand un seul réseau correspond.
watch(address, (v) => {
  touched.value = true;
  if (internal.value) return;
  const matches = matchingNetworks(nets.value, v);
  if (matches.length === 1) networkId.value = matches[0].id;
  else if (matches.length && !matches.some((n) => n.id === networkId.value)) networkId.value = null;
});
networkId.value = nets.value.length === 1 ? nets.value[0].id : null;

const coinOptions = computed(() => feed.coins.filter((c) => networks[c.id]).map((c) => ({ value: c.id, label: c.ticker, short: c.ticker, sub: c.name, glyph: c.glyph, tone: c.tone, keywords: c.name })));
const netOptions = computed(() => nets.value.map((n) => ({ value: n.id, label: n.name, short: n.name, sub: `${q(n.fee)} ${coin.value.ticker}` })));

const fee = computed(() => (internal.value ? 0 : network.value?.fee ?? 0));
const min = computed(() => (internal.value ? 10 ** -Math.min(qtyDec.value, 6) : network.value?.min ?? 0));
const balance = computed(() => balanceOf(coinId.value));
const limit = computed(() => sendLimitXof / coin.value.price);
const value = computed(() => fmt.parse(amount.value));
const received = computed(() => (Number.isFinite(value.value) ? Math.max(0, value.value - fee.value) : null));

const recipientError = computed(() => {
  const v = address.value.trim();
  if (!v) return submitted.value ? (internal.value ? props.data.errors.recipient : props.data.errors.addressEmpty) : '';
  if (internal.value) return isValidRecipient(v) ? '' : props.data.errors.recipient;
  if (!network.value) return matchingNetworks(nets.value, v).length ? '' : t(props.data.errors.addressAny, { coin: coin.value.ticker });
  return isValidAddress(network.value.family, v) ? '' : t(props.data.errors.address, { network: network.value.name });
});
const networkError = computed(() => (!internal.value && submitted.value && !network.value ? props.data.errors.network : ''));
const amountError = computed(() => {
  if (!amount.value) return submitted.value ? props.data.errors.amount : '';
  const v = value.value;
  if (!Number.isFinite(v) || v <= 0) return props.data.errors.amount;
  if (v < min.value) return t(props.data.errors.min, { min: `${q(min.value)} ${coin.value.ticker}` });
  if (v > balance.value) return props.data.errors.balance;
  if (v > limit.value) return props.data.errors.limit;
  return '';
});

function setAll() {
  amount.value = q(Math.max(0, balance.value));
}

const recipientOk = computed(() => address.value.trim() && !recipientError.value);
const step = computed(() => {
  if (!touched.value) return 0;
  if (!recipientOk.value) return 1;
  if (!internal.value && !network.value) return 2;
  return 3;
});
watch(step, (s) => emit('step', s), { immediate: true });

function onSubmit(e) {
  e.preventDefault();
  submitted.value = true;
  if (recipientError.value || networkError.value || amountError.value) return;
  if (props.common.links.sendAction === '#') notice.value = props.data.demo;
  else e.target.submit();
}
</script>

<template>
  <form class="sd z-panel" :action="common.links.sendAction" method="post" :aria-label="data.label" novalidate @submit="onSubmit">
    <StepBlock :n="1" :title="data.steps.coin" done>
      <ZSelect v-model="coinId" variant="field" :options="coinOptions" :label="data.coin" searchable :search-label="data.coinSearch" :empty="data.empty" />
    </StepBlock>

    <StepBlock :n="2" :title="data.steps.address" :done="!!recipientOk && (internal || !!network)">
      <div class="sd__field" :class="{ 'is-invalid': recipientError }">
        <label class="sd__flabel" for="sd-address">{{ internal ? data.recipient : data.address }}</label>
        <textarea
          id="sd-address"
          v-model="address"
          name="address"
          rows="2"
          spellcheck="false"
          autocomplete="off"
          :placeholder="internal ? data.recipientPlaceholder : data.addressPlaceholder"
          :aria-invalid="!!recipientError"
          :aria-describedby="recipientError ? 'sd-address-err' : undefined"
        />
        <button v-if="!internal" type="button" class="sd__book" :aria-expanded="bookOpen" @click="bookOpen = !bookOpen">{{ data.book }}</button>
      </div>
      <p v-if="bookOpen && !internal" class="sd__book-empty"><ZIcon name="book" :size="16" /> {{ data.bookEmpty }}</p>
      <p v-if="recipientError" id="sd-address-err" class="z-error">{{ recipientError }}</p>

      <label class="sd__check">
        <input v-model="internal" type="checkbox" name="internal" />
        <span class="sd__box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
        <span>{{ data.internal }}<small>{{ data.internalHint }}</small></span>
      </label>

      <template v-if="!internal">
        <span class="sd__sub">{{ data.network }}</span>
        <ZSelect v-model="networkId" variant="field" :options="netOptions" :label="data.network" :placeholder="data.networkPlaceholder" />
        <p v-if="!network" class="z-hint">{{ data.networkHint }}</p>
        <p v-if="networkError" class="z-error">{{ networkError }}</p>
        <template v-if="network?.memo">
          <label class="sd__sub" for="sd-memo">{{ data.memo }}</label>
          <input id="sd-memo" v-model="memo" class="z-input" name="memo" autocomplete="off" :placeholder="data.memoPlaceholder" />
        </template>
      </template>
    </StepBlock>

    <StepBlock :n="3" :title="data.steps.details" last>
      <p class="sd__limit num">{{ t(data.limit, { max: `${q(limit)} ${coin.ticker}` }) }}</p>
      <div class="sd__amount" :class="{ 'is-invalid': amountError }">
        <label class="sr-only" for="sd-amount">{{ data.amount }} ({{ coin.ticker }})</label>
        <input
          id="sd-amount"
          v-model="amount"
          name="amount"
          class="num"
          inputmode="decimal"
          autocomplete="off"
          :placeholder="t(data.amountPlaceholder, { min: q(min) })"
          :aria-invalid="!!amountError"
          :aria-describedby="amountError ? 'sd-amount-err' : undefined"
        />
        <span class="sd__unit">{{ coin.ticker }}</span>
        <button type="button" class="sd__all num" @click="setAll">{{ data.all }} {{ q(balance) }}</button>
      </div>
      <p v-if="amountError" id="sd-amount-err" class="z-error">{{ amountError }}</p>
      <p class="sd__balance">{{ data.available }} : <strong class="num">{{ q(balance) }} {{ coin.ticker }}</strong></p>

      <label class="sr-only" for="sd-note">{{ data.note }}</label>
      <input id="sd-note" v-model="note" class="z-input sd__note" name="note" maxlength="80" autocomplete="off" :placeholder="data.notePlaceholder" />

      <div class="sd__foot">
        <div>
          <span class="sd__recv-label">{{ data.received }}</span>
          <strong class="sd__recv num">{{ received === null ? '--' : q(received) }} {{ coin.ticker }}</strong>
          <span class="sd__fee num">{{ t(data.fees, { fee: internal ? data.free : `${q(fee)} ${coin.ticker}` }) }}</span>
        </div>
        <ZButton type="submit" size="lg" class="sd__cta">{{ data.cta }}</ZButton>
      </div>
      <p v-if="notice" class="z-notice sd__notice" role="status">{{ notice }}</p>
      <p v-if="demo" class="sd__demo">{{ data.balancesNote }}</p>
    </StepBlock>
  </form>
</template>

<style scoped>
.sd { padding: 26px 24px 4px; }
.sd__field { position: relative; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-strong); transition: border-color var(--motion-duration-hover); }
.sd__field:focus-within { border-color: var(--color-brand-secondary-300); }
.sd__field.is-invalid { border-color: var(--color-state-down); }
.sd__flabel { display: block; padding: 12px 16px 0; font-size: var(--font-size-small); color: var(--color-text-muted); }
.sd__field textarea { width: 100%; padding: 6px 150px 12px 16px; background: none; border: 0; outline: none; resize: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; line-height: 1.5; }
.sd__field textarea::placeholder { font-family: var(--font-family-sans); color: var(--color-text-dim); }
.sd__book { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); }
.sd__book:hover { color: var(--color-text-default); }
.sd__book-empty { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; color: var(--color-text-muted); }
.sd__check { position: relative; display: flex; gap: 10px; margin-top: 16px; font-size: 14px; cursor: pointer; }
.sd__check input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.sd__box { display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 50%; border: 1px solid var(--color-text-dim); color: transparent; transition: background-color var(--motion-duration-hover); }
.sd__check input:checked + .sd__box { background: var(--gradient-brand); border-color: transparent; color: var(--color-on-brand); }
.sd__check input:focus-visible + .sd__box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.sd__check small { display: block; font-size: 12px; color: var(--color-text-muted); }
.sd__sub { display: block; margin: 18px 0 8px; font-size: var(--font-size-small); color: var(--color-text-muted); }
.sd__limit { margin-bottom: 10px; font-size: 12px; color: var(--color-text-dim); text-align: right; }
.sd__amount { display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 16px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-strong); }
.sd__amount:focus-within { border-color: var(--color-brand-secondary-300); }
.sd__amount.is-invalid { border-color: var(--color-state-down); }
.sd__amount input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; font-size: 16px; }
.sd__amount input::placeholder { color: var(--color-text-dim); }
.sd__unit { font-size: 13px; color: var(--color-text-muted); }
.sd__all { font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); white-space: nowrap; }
.sd__balance { margin-top: 12px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; color: var(--color-text-muted); }
.sd__balance strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.sd__note { margin-top: 12px; }
.sd__foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-top: 22px; }
.sd__recv-label { display: block; font-size: 12px; color: var(--color-text-muted); }
.sd__recv { display: block; margin: 4px 0; font-size: 28px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.sd__fee { font-size: 12px; color: var(--color-text-dim); }
.sd__cta { min-width: 160px; height: 48px; border-radius: var(--radius-pill); }
.sd__notice { margin-top: 14px; }
.sd__demo { margin-top: 10px; font-size: var(--font-size-small); color: var(--color-text-dim); }
</style>
