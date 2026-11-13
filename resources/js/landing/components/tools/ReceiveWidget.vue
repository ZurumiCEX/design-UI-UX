<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { networks, quickCoins } from '../../content/data.js';
import { useI18n } from '../../composables/useI18n.js';
import { useMarketFeed } from '../../composables/useMarketFeed.js';
import { demoDepositAddress, demoMemo } from '../../market/addresses.js';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZQrCode from '../ui/ZQrCode.vue';
import ZSelect from '../ui/ZSelect.vue';
import StepBlock from './StepBlock.vue';

// Recevoir : crypto → réseau → adresse de dépôt (copie, QR code, mémo) et conditions.
const props = defineProps({
  data: { type: Object, required: true }, // pages.receive.widget
  common: { type: Object, required: true },
});
const emit = defineEmits(['step']);
const { fmt, t, parts } = useI18n();
const feed = useMarketFeed();

const supported = computed(() => feed.coins.filter((c) => networks[c.id]));
const fromUrl = new URLSearchParams(window.location.search).get('crypto');
const coinId = ref(networks[fromUrl] ? fromUrl : 'usdt');
const coin = computed(() => feed.coins.find((c) => c.id === coinId.value));
const nets = computed(() => networks[coinId.value]);
const networkId = ref(nets.value.length === 1 ? nets.value[0].id : null);
const network = computed(() => nets.value.find((n) => n.id === networkId.value) ?? null);
const touched = ref(false);
const warningOpen = ref(true);
const showQr = ref(false);
const copied = ref('');
let copyTimer = 0;

watch(coinId, () => {
  touched.value = true;
  networkId.value = nets.value.length === 1 ? nets.value[0].id : null;
  warningOpen.value = true;
  showQr.value = false;
  copied.value = '';
});

const address = computed(() => (network.value ? demoDepositAddress(network.value) : ''));
const memo = computed(() => (network.value?.memo ? demoMemo(network.value) : ''));

const coinOptions = computed(() => supported.value.map((c) => ({ value: c.id, label: c.ticker, short: c.ticker, sub: c.name, glyph: c.glyph, tone: c.tone, keywords: c.name })));
const netOptions = computed(() => nets.value.map((n) => ({ value: n.id, label: n.name, short: n.name, sub: `≈ ${n.eta} min` })));
const quick = computed(() => quickCoins.map((id) => feed.coins.find((c) => c.id === id)));

async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* presse-papiers indisponible : l'adresse reste sélectionnable à la main */
  }
  copied.value = key;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied.value = ''), 2000);
}
onBeforeUnmount(() => clearTimeout(copyTimer));

const used = ref(false);
watch(copied, (v) => v && (used.value = true));
watch(showQr, (v) => v && (used.value = true));
const step = computed(() => (!network.value ? (touched.value ? 1 : 0) : used.value ? 3 : 2));
watch(step, (s) => emit('step', s), { immediate: true });
</script>

<template>
  <div class="rc z-panel" :aria-label="data.label" role="group">
    <StepBlock :n="1" :title="data.steps.coin" done>
      <ZSelect v-model="coinId" variant="field" :options="coinOptions" :label="data.coin" searchable :search-label="data.coinSearch" :empty="data.empty" />
      <div class="rc__quick" role="group" :aria-label="data.popular">
        <button v-for="c in quick" :key="c.id" type="button" class="rc__chip" :aria-pressed="coinId === c.id" @click="coinId = c.id">
          <ZCoinIcon :glyph="c.glyph" :tone="c.tone" :size="18" /> {{ c.ticker }}
        </button>
      </div>
    </StepBlock>

    <StepBlock :n="2" :title="data.steps.network" :done="!!network">
      <ZSelect v-if="nets.length" v-model="networkId" variant="field" :options="netOptions" :label="data.network" :placeholder="data.networkPlaceholder" />
    </StepBlock>

    <StepBlock :n="3" :title="data.steps.details" last>
      <template v-if="network">
        <div v-if="warningOpen" class="rc__warn" role="note">
          <ZIcon name="alert" :size="18" />
          <p>
            <template v-for="(p, i) in parts(data.warning)" :key="i">
              <strong v-if="p.slot === 'coin'">{{ coin.ticker }}</strong>
              <strong v-else-if="p.slot === 'network'">{{ network.name }}</strong>
              <template v-else>{{ p.text }}</template>
            </template>
          </p>
          <button type="button" :aria-label="data.dismiss" @click="warningOpen = false"><ZIcon name="close" :size="14" /></button>
        </div>

        <div class="rc__addr">
          <span class="rc__addr-label">{{ data.address }}</span>
          <span class="rc__demo label">{{ data.demoBadge }}</span>
          <p class="rc__value">{{ address }}</p>
          <div class="rc__actions">
            <button type="button" class="rc__copy" @click="copy(address, 'address')">
              <ZIcon :name="copied === 'address' ? 'check' : 'copy'" :size="16" /> {{ copied === 'address' ? data.copied : data.copy }}
            </button>
            <button type="button" class="rc__qr-btn" :aria-pressed="showQr" :aria-label="showQr ? data.hideQr : data.showQr" @click="showQr = !showQr">
              <ZIcon name="qr" :size="20" />
            </button>
          </div>
          <div v-if="showQr" class="rc__qr">
            <ZQrCode :value="address" :label="t(data.qrAlt, { coin: coin.ticker, network: network.name })" :size="168" />
          </div>
          <span class="sr-only" role="status">{{ copied ? data.copied : '' }}</span>
        </div>

        <div v-if="memo" class="rc__addr rc__memo">
          <span class="rc__addr-label">{{ data.memo }}</span>
          <p class="rc__value">{{ memo }}</p>
          <button type="button" class="rc__copy" @click="copy(memo, 'memo')">
            <ZIcon :name="copied === 'memo' ? 'check' : 'copy'" :size="16" /> {{ copied === 'memo' ? data.copied : data.copy }}
          </button>
          <p class="rc__memo-warn">{{ data.memoWarning }}</p>
        </div>

        <dl class="rc__details">
          <div><dt>{{ data.details.min }}</dt><dd class="num">{{ fmt.num(network.min, 0, 8) }} {{ coin.ticker }}</dd></div>
          <div><dt>{{ data.details.confirmations }}</dt><dd class="num">{{ t(data.details.blocks, { n: network.confirmations }) }}</dd></div>
          <div><dt>{{ data.details.arrival }}</dt><dd class="num">≈ {{ network.eta }} min</dd></div>
        </dl>
      </template>
      <p v-else class="rc__pick">{{ data.chooseNetwork }}</p>
    </StepBlock>
  </div>
</template>

<style scoped>
.rc { padding: 26px 24px 4px; }
.rc__quick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.rc__chip {
  display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 12px 0 8px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: var(--font-weight-semibold); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default);
  transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover);
}
.rc__chip:hover { border-color: var(--color-line-strong); }
.rc__chip[aria-pressed='true'] { border-color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.rc__pick { font-size: 13px; color: var(--color-text-dim); }
.rc__warn {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 14px 16px; border-radius: var(--radius-md);
  color: var(--color-state-warn); background: color-mix(in srgb, var(--color-state-warn) 12%, transparent); border: 1px solid color-mix(in srgb, var(--color-state-warn) 40%, transparent);
}
.rc__warn p { font-size: 13px; color: var(--color-text-default); }
.rc__warn strong { color: var(--color-state-warn); }
.rc__warn button { color: var(--color-state-warn); }
.rc__addr { position: relative; margin-top: 16px; padding: 22px 18px 18px; border-radius: var(--radius-md); border: 1px solid var(--color-line-strong); background: var(--color-bg-surface-2); }
.rc__addr-label { position: absolute; top: -9px; left: 14px; padding: 0 6px; font-size: 12px; color: var(--color-text-muted); background: var(--color-bg-surface); }
.rc__demo { display: inline-block; margin-bottom: 10px; padding: 3px 8px; border-radius: 4px; color: var(--color-state-warn); background: color-mix(in srgb, var(--color-state-warn) 14%, transparent); }
.rc__value { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 15px; font-weight: var(--font-weight-semibold); line-height: 1.5; overflow-wrap: anywhere; }
.rc__actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.rc__copy {
  display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 20px; border-radius: var(--radius-md);
  background: var(--color-text-default); color: var(--ink); font-size: 14px; font-weight: var(--font-weight-semibold);
  transition: transform var(--motion-duration-hover) var(--motion-ease-out);
}
.rc__memo .rc__copy { margin-top: 12px; }
.rc__copy:hover { transform: translateY(-1px); }
.rc__qr-btn { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--radius-md); color: var(--color-text-muted); border: 1px solid var(--color-line-strong); }
.rc__qr-btn[aria-pressed='true'], .rc__qr-btn:hover { color: var(--color-text-default); border-color: var(--color-brand-primary-300); }
.rc__qr { display: grid; justify-items: start; margin-top: 16px; }
.rc__memo-warn { margin-top: 10px; font-size: 12.5px; color: var(--color-state-warn); }
.rc__details { display: grid; gap: 12px; margin: 16px 0 0; padding: 18px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; }
.rc__details div { display: flex; justify-content: space-between; gap: 16px; }
.rc__details dt { color: var(--color-text-muted); }
.rc__details dd { margin: 0; font-weight: var(--font-weight-semibold); }
</style>
