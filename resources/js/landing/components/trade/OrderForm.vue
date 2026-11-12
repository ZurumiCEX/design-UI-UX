<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';

// Formulaire d'ordre au comptant : achat / vente, limite / marché.
const props = defineProps({
  sim: { type: Object, required: true },
  pair: { type: Object, required: true },
  data: { type: Object, required: true }, // pages.trade.form
  links: { type: Object, required: true },
  user: { type: Object, default: null },
});
const { fmt, t } = useI18n();

const side = ref('buy');
const type = ref('limit');
const price = ref('');
const amount = ref('');
const total = ref('');
const percent = ref(0);

const dec = computed(() => props.sim.decimals);
const amtDec = computed(() => props.sim.amountDecimals);
const priceValue = computed(() => (type.value === 'market' ? props.sim.last : fmt.parse(price.value)));

function resetPrice() {
  price.value = fmt.num(props.sim.last, dec.value);
  amount.value = '';
  total.value = '';
  percent.value = 0;
}
watch(() => props.pair.id, resetPrice, { immediate: true });

function setPrice(p) {
  type.value = 'limit';
  price.value = fmt.num(p, dec.value);
  syncTotal();
}
function stepPrice(dir) {
  const p = Number.isFinite(priceValue.value) ? priceValue.value : props.sim.last;
  price.value = fmt.num(Math.max(props.sim.tick, p + dir * props.sim.tick), dec.value);
  syncTotal();
}
function syncTotal() {
  const a = fmt.parse(amount.value);
  total.value = Number.isFinite(a) && Number.isFinite(priceValue.value) ? fmt.num(a * priceValue.value, 2) : '';
}
function syncAmount() {
  const tt = fmt.parse(total.value);
  amount.value = Number.isFinite(tt) && priceValue.value > 0 ? fmt.num(tt / priceValue.value, amtDec.value) : '';
}
defineExpose({ setPrice });

const balance = computed(() => (props.user?.balances ? props.user.balances[side.value === 'buy' ? props.pair.quote : props.pair.base] : null));
const minAmount = computed(() => fmt.num(10 ** -Math.min(amtDec.value, 5), Math.min(amtDec.value, 5)));
const marks = [0, 25, 50, 75, 100];
</script>

<template>
  <section class="of" :aria-label="data.label">
    <div class="z-seg of__sides" role="tablist" :aria-label="data.label">
      <button v-for="s in ['buy', 'sell']" :key="s" type="button" role="tab" :class="`is-${s}`" :aria-selected="side === s" @click="side = s">
        {{ data.sides[s] }}
      </button>
    </div>

    <div class="z-tabs of__types" role="tablist" :aria-label="data.types.label">
      <button v-for="tp in ['limit', 'market']" :key="tp" type="button" role="tab" class="z-tab" :aria-selected="type === tp" @click="type = tp; syncTotal()">
        {{ data.types[tp] }}
      </button>
    </div>

    <form class="of__form" novalidate @submit.prevent>
      <label class="of__field" :class="{ 'is-disabled': type === 'market' }">
        <span class="of__label">{{ data.price }}</span>
        <input
          v-if="type === 'limit'"
          v-model="price"
          class="num"
          inputmode="decimal"
          autocomplete="off"
          @input="syncTotal"
        />
        <input v-else class="num" :value="data.marketPrice" disabled />
        <span class="of__unit">{{ pair.quote }}</span>
        <span v-if="type === 'limit'" class="of__steps">
          <button type="button" :aria-label="data.increase" @click="stepPrice(1)"><ZIcon name="plus" :size="12" /></button>
          <button type="button" :aria-label="data.decrease" @click="stepPrice(-1)"><ZIcon name="minus" :size="12" /></button>
        </span>
      </label>

      <label class="of__field">
        <span class="of__label">{{ data.amount }}</span>
        <input v-model="amount" class="num" inputmode="decimal" autocomplete="off" :placeholder="minAmount" @input="syncTotal" />
        <span class="of__unit">{{ pair.base }}</span>
      </label>

      <div class="of__slider">
        <input
          v-model.number="percent"
          type="range"
          min="0"
          max="100"
          step="25"
          :aria-label="data.percent"
          :aria-valuetext="`${percent} %`"
          :disabled="!user"
          :style="{ '--fill': `${percent}%` }"
        />
        <div class="of__marks" aria-hidden="true"><i v-for="m in marks" :key="m" :class="{ 'is-on': percent >= m }" /></div>
      </div>

      <label class="of__field">
        <span class="of__label">{{ data.total }}</span>
        <input v-model="total" class="num" inputmode="decimal" autocomplete="off" @input="syncAmount" />
        <span class="of__unit">{{ pair.quote }}</span>
      </label>

      <dl class="of__info">
        <div>
          <dt>{{ data.available }}</dt>
          <dd class="num">{{ balance ?? '—' }} {{ side === 'buy' ? pair.quote : pair.base }}</dd>
        </div>
        <div>
          <dt>{{ data.max[side] }}</dt>
          <dd class="num">{{ user ? '—' : 0 }} {{ pair.base }}</dd>
        </div>
      </dl>

      <template v-if="user">
        <ZButton type="submit" size="lg" class="of__cta" :class="`is-${side}`">{{ t(data.submit[side], { ticker: pair.base }) }}</ZButton>
      </template>
      <template v-else>
        <ZButton size="lg" class="of__cta" :href="links.login">{{ data.login }}</ZButton>
        <ZButton size="lg" variant="ghost" class="of__cta" :href="links.signup">{{ data.signup }}</ZButton>
        <p class="of__hint">{{ data.hint }}</p>
      </template>
    </form>
  </section>
</template>

<style scoped>
.of { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
.of__types { gap: 18px; }
.of__types .z-tab { font-size: 13px; padding: 8px 0; }
.of__form { display: grid; gap: 12px; }
.of__field {
  position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 8px; height: 44px; padding: 0 6px 0 12px;
  border-radius: var(--radius-sm); background: var(--fill-1); border: 1px solid var(--color-line-default);
  transition: border-color var(--motion-duration-hover);
}
.of__field:focus-within { border-color: var(--color-brand-secondary-300); }
.of__field.is-disabled { opacity: 0.7; }
.of__label { font-size: 12px; color: var(--color-text-dim); }
.of__field input { min-width: 0; height: 100%; background: none; border: 0; outline: none; text-align: right; font-size: 14px; font-weight: var(--font-weight-medium); }
.of__field input::placeholder { color: var(--color-text-dim); font-weight: var(--font-weight-regular); }
.of__field input:disabled { color: var(--color-text-muted); }
.of__unit { font-size: 12px; color: var(--color-text-muted); padding-right: 6px; }
.of__steps { display: grid; border-left: 1px solid var(--color-line-default); }
.of__steps button { display: grid; place-items: center; width: 22px; height: 20px; color: var(--color-text-muted); }
.of__steps button:hover { color: var(--color-text-default); }
.of__slider { position: relative; padding: 6px 0; }
.of__slider input { width: 100%; height: 14px; margin: 0; appearance: none; -webkit-appearance: none; background: transparent; position: relative; z-index: 1; cursor: pointer; }
.of__slider input:disabled { cursor: not-allowed; }
.of__slider input::-webkit-slider-runnable-track { height: 2px; border-radius: 2px; background: linear-gradient(90deg, var(--color-brand-primary-300) var(--fill), var(--color-line-strong) var(--fill)); }
.of__slider input::-moz-range-track { height: 2px; border-radius: 2px; background: linear-gradient(90deg, var(--color-brand-primary-300) var(--fill), var(--color-line-strong) var(--fill)); }
.of__slider input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -6px; border-radius: 50%; background: var(--color-bg-base); border: 2px solid var(--color-text-default); }
.of__slider input::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: var(--color-bg-base); border: 2px solid var(--color-text-default); }
.of__marks { position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: center; pointer-events: none; }
.of__marks i { width: 8px; height: 8px; border-radius: 50%; background: var(--color-bg-surface); border: 1px solid var(--color-line-strong); }
.of__marks i.is-on { border-color: var(--color-brand-primary-300); }
.of__info { display: grid; gap: 6px; margin: 2px 0 0; font-size: 12px; }
.of__info div { display: flex; justify-content: space-between; }
.of__info dt { color: var(--color-text-dim); }
.of__info dd { margin: 0; }
.of__cta { width: 100%; }
.of__hint { font-size: var(--font-size-small); color: var(--color-text-dim); text-align: center; }
</style>
