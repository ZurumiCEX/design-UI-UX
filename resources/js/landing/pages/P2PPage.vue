<script setup>
import { computed, ref } from 'vue';
import { p2pCoins, p2pOffers } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import { useWallet } from '../composables/useWallet.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import SellSheet from '../components/p2p/SellSheet.vue';
import TutorialSteps from '../components/tools/TutorialSteps.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZCoinIcon from '../components/ui/ZCoinIcon.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZSelect from '../components/ui/ZSelect.vue';

// P2P : uniquement la VENTE d'USDT ou d'USDC contre des XOF (Wave, Orange Money, Mixx by Yas).
const { i18n, fmt, t } = useI18n();
const { balanceOf } = useWallet();
const data = computed(() => i18n.content.pages.p2p);
const common = computed(() => i18n.content.common);

const coinId = ref(p2pCoins.includes(new URLSearchParams(window.location.search).get('crypto')) ? new URLSearchParams(window.location.search).get('crypto') : 'usdt');
const coin = computed(() => common.value.coins.find((c) => c.id === coinId.value));
const amount = ref('');
const method = ref('all');
const sort = ref('price');
const selected = ref(null);

const methodOptions = computed(() => [
  { value: 'all', label: data.value.filters.all },
  ...common.value.paymentMethods.map((m) => ({ value: m.id, label: m.name, glyph: m.glyph, tone: m.tone })),
]);
const sortOptions = computed(() => Object.entries(data.value.filters.sorts).map(([value, label]) => ({ value, label })));

const offers = computed(() => {
  const target = fmt.parse(amount.value);
  return p2pOffers
    .filter((o) => o.price[coinId.value] > 0 && o.available[coinId.value] > 0)
    .filter((o) => method.value === 'all' || o.methods.includes(method.value))
    .filter((o) => !Number.isFinite(target) || (target >= o.limits.min && target <= o.limits.max))
    .sort((a, b) =>
      sort.value === 'price' ? b.price[coinId.value] - a.price[coinId.value] : sort.value === 'completion' ? b.completion - a.completion : b.orders - a.orders,
    );
});
const best = computed(() => offers.value[0]?.price[coinId.value]);
const methodById = (id) => common.value.paymentMethods.find((m) => m.id === id);
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
</script>

<template>
  <SiteLayout page="p2p">
    <div class="container page p2p">
      <header class="p2p__head">
        <span class="p2p__tag label">P2P</span>
        <h1 v-split class="title" v-html="data.title" />
        <p v-reveal class="lede">{{ data.text }}</p>
      </header>

      <div class="p2p__grid">
        <section class="p2p__main" :aria-label="t(data.table.caption, { coin: coin.ticker })">
          <div class="p2p__bar">
            <div class="z-seg p2p__coins" role="tablist" :aria-label="data.coinLabel">
              <button v-for="id in p2pCoins" :key="id" type="button" role="tab" :aria-selected="coinId === id" @click="coinId = id">
                {{ t(data.sellTab, { coin: common.coins.find((c) => c.id === id).ticker }) }}
              </button>
            </div>
            <p class="p2p__balance num">{{ data.balance }} <strong>{{ fmt.num(balanceOf(coinId), 2) }} {{ coin.ticker }}</strong></p>
          </div>

          <div class="p2p__filters">
            <label class="p2p__amount">
              <span class="sr-only">{{ data.filters.amount }}</span>
              <input v-model="amount" class="num" inputmode="decimal" autocomplete="off" :placeholder="data.filters.amountPlaceholder" />
              <span>XOF</span>
            </label>
            <ZSelect v-model="method" :options="methodOptions" :label="data.filters.method" />
            <ZSelect v-model="sort" :options="sortOptions" :label="data.filters.sort" align="right" />
          </div>

          <ul class="p2p__list" role="list">
            <li class="p2p__cols" aria-hidden="true">
              <span>{{ data.table.buyer }}</span><span>{{ data.table.price }}</span><span>{{ data.table.available }}</span><span>{{ data.table.methods }}</span><span />
            </li>
            <li v-for="o in offers" :key="o.id" class="offer">
              <div class="offer__who">
                <span class="offer__avatar" aria-hidden="true">{{ initials(o.merchant) }}</span>
                <div>
                  <p class="offer__name">
                    {{ o.merchant }}
                    <span v-if="o.verified" class="offer__verified" :title="data.table.verified"><ZIcon name="badge" :size="14" /><span class="sr-only">{{ data.table.verified }}</span></span>
                  </p>
                  <p class="offer__stats num">
                    {{ t(data.table.orders, { n: fmt.num(o.orders) }) }} · {{ t(data.table.completion, { n: fmt.num(o.completion, 1) }) }}
                  </p>
                  <p class="offer__release"><ZIcon name="clock" :size="12" /> {{ t(data.table.release, { n: o.release }) }}</p>
                </div>
              </div>
              <div class="offer__price">
                <strong class="num">{{ fmt.num(o.price[coinId]) }}</strong> <span>{{ t(data.table.perUnit, { coin: coin.ticker }) }}</span>
                <span v-if="o.price[coinId] === best" class="offer__best label">{{ data.table.best }}</span>
              </div>
              <div class="offer__limits num">
                <p><span>{{ data.table.availableShort }}</span> {{ fmt.num(o.available[coinId]) }} {{ coin.ticker }}</p>
                <p><span>{{ data.table.limitsShort }}</span> {{ fmt.num(o.limits.min) }} – {{ fmt.num(o.limits.max) }} XOF</p>
              </div>
              <ul class="offer__methods">
                <li v-for="m in o.methods" :key="m"><ZCoinIcon :glyph="methodById(m).glyph" :tone="methodById(m).tone" :size="16" /> {{ methodById(m).name }}</li>
              </ul>
              <ZButton class="offer__cta" @click="selected = o">{{ t(data.table.sell, { coin: coin.ticker }) }}<span class="sr-only"> — {{ o.merchant }}</span></ZButton>
            </li>
          </ul>
          <p v-if="!offers.length" class="p2p__empty" role="status">{{ data.table.empty }}</p>
          <p class="p2p__note">{{ data.note }}</p>
        </section>

        <TutorialSteps class="p2p__tuto" :data="data.tutorial" :active="selected ? 1 : 0" />
      </div>
    </div>

    <SellSheet v-if="selected" :offer="selected" :coin="coin" :data="data.sheet" :common="common" @close="selected = null" />
  </SiteLayout>
</template>

<style scoped>
.p2p__head { max-width: 720px; }
.p2p__tag { display: inline-block; margin-bottom: 18px; padding: 5px 10px; border-radius: var(--radius-sm); color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.p2p__head .lede { margin-top: 18px; }
.p2p__grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 32px; align-items: start; margin-top: 48px; }
.p2p__tuto { position: sticky; top: calc(var(--space-nav-height) + 24px); }
.p2p__bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.p2p__coins { min-width: 280px; }
.p2p__balance { font-size: 13px; color: var(--color-text-muted); }
.p2p__balance strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.p2p__filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.p2p__amount { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 13px; color: var(--color-text-muted); }
.p2p__amount:focus-within { border-color: var(--color-brand-secondary-300); }
.p2p__amount input { width: 140px; background: none; border: 0; outline: none; color: var(--color-text-default); }
.p2p__list { margin-top: 20px; }
.p2p__cols, .offer { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr) auto; gap: 16px; align-items: center; }
.p2p__cols { padding: 10px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 12px; color: var(--color-text-muted); }
.offer { padding: 18px 16px; border-bottom: 1px solid var(--color-line-default); transition: background-color var(--motion-duration-hover); }
.offer:hover { background: var(--fill-1); }
.offer__who { display: flex; gap: 12px; }
.offer__avatar { display: grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 50%; background: var(--gradient-brand); font-size: 12px; font-weight: var(--font-weight-bold); }
.offer__name { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: var(--font-weight-semibold); }
.offer__verified { display: inline-grid; color: var(--color-brand-primary-300); }
.offer__stats, .offer__release { margin-top: 3px; font-size: 12px; color: var(--color-text-muted); }
.offer__release { display: flex; align-items: center; gap: 4px; color: var(--color-text-dim); }
.offer__price strong { font-size: 20px; font-weight: var(--font-weight-semibold); }
.offer__price span { font-size: 12px; color: var(--color-text-muted); }
.offer__best { display: block; width: max-content; margin-top: 6px; padding: 2px 6px; font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; border-radius: 4px; color: var(--color-state-up) !important; background: color-mix(in srgb, var(--color-state-up) 14%, transparent); }
.offer__limits { display: grid; gap: 4px; font-size: 13px; }
.offer__limits span { color: var(--color-text-dim); margin-right: 4px; }
.offer__methods { display: grid; gap: 6px; font-size: 12.5px; }
.offer__methods li { display: flex; align-items: center; gap: 6px; }
.offer__cta { background: var(--color-state-up) !important; color: var(--ink) !important; box-shadow: none !important; }
.p2p__empty { padding: 48px 0; text-align: center; color: var(--color-text-muted); }
.p2p__note { margin-top: 20px; font-size: var(--font-size-small); color: var(--color-text-dim); }

@media (max-width: 1180px) {
  .p2p__grid { grid-template-columns: 1fr; }
  .p2p__tuto { position: static; }
}
@media (max-width: 860px) {
  .p2p__cols { display: none; }
  .offer { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'who price' 'limits limits' 'methods cta'; gap: 12px; margin-bottom: 10px; border: 1px solid var(--color-line-default); border-radius: var(--radius-md); }
  .offer__who { grid-area: who; }
  .offer__price { grid-area: price; text-align: right; }
  .offer__limits { grid-area: limits; }
  .offer__methods { grid-area: methods; grid-auto-flow: column; justify-content: start; }
  .offer__cta { grid-area: cta; }
  .p2p__coins { min-width: 0; width: 100%; }
  .p2p__amount { flex: 1; }
  .p2p__amount input { width: 100%; }
}
</style>
