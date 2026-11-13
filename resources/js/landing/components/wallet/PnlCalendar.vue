<script setup>
import { computed, ref } from 'vue';
import ZIcon from '../ui/ZIcon.vue';

// Calendrier du P&L : un mois par écran, chaque jour porte sa valeur signée (+/−) et une teinte
// verte ou rouge d'intensité proportionnelle (la couleur n'est jamais seule porteuse du sens).
const props = defineProps({
  days: { type: Array, required: true }, // [{ t, v, pct }]
  formatCompact: { type: Function, required: true },
  formatValue: { type: Function, required: true },
  monthLabel: { type: Function, required: true }, // (Date) => « novembre 2026 »
  weekdays: { type: Array, required: true }, // 7 libellés, lundi en premier
  labels: { type: Object, required: true }, // { prev, next }
  hidden: { type: Boolean, default: false },
});
const byDay = computed(() => new Map(props.days.map((d) => [new Date(d.t).toDateString(), d])));
const max = computed(() => Math.max(...props.days.map((d) => Math.abs(d.v))) || 1);
const last = new Date(props.days.at(-1).t);
const first = new Date(props.days[0].t);
const month = ref(new Date(last.getFullYear(), last.getMonth(), 1));
const canPrev = computed(() => month.value > new Date(first.getFullYear(), first.getMonth(), 1));
const canNext = computed(() => month.value < new Date(last.getFullYear(), last.getMonth(), 1));
const shift = (n) => (month.value = new Date(month.value.getFullYear(), month.value.getMonth() + n, 1));

const cells = computed(() => {
  const m = month.value;
  const lead = (m.getDay() + 6) % 7; // lundi = 0
  const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const out = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= count; d++) {
    const date = new Date(m.getFullYear(), m.getMonth(), d);
    out.push({ date, n: d, data: byDay.value.get(date.toDateString()) });
  }
  return out;
});
const tone = (v) => 0.12 + 0.5 * Math.min(1, Math.abs(v) / max.value);
</script>

<template>
  <div class="pcal">
    <div class="pcal__head">
      <button type="button" :disabled="!canPrev" :aria-label="labels.prev" @click="shift(-1)"><ZIcon name="arrow-left" :size="16" /></button>
      <strong>{{ monthLabel(month) }}</strong>
      <button type="button" :disabled="!canNext" :aria-label="labels.next" @click="shift(1)"><ZIcon name="arrow-right" :size="16" /></button>
    </div>
    <div class="pcal__grid" role="grid" :aria-label="monthLabel(month)">
      <span v-for="w in weekdays" :key="w" class="pcal__wd" role="columnheader">{{ w }}</span>
      <template v-for="(c, i) in cells" :key="i">
        <span v-if="!c" class="pcal__cell is-empty" role="presentation" />
        <span
          v-else
          class="pcal__cell"
          :class="c.data ? (c.data.v >= 0 ? 'is-up' : 'is-down') : 'is-none'"
          role="gridcell"
          :style="c.data ? { '--a': tone(c.data.v) } : null"
          :title="c.data && !hidden ? `${c.n} : ${c.data.v >= 0 ? '+' : '−'}${formatValue(Math.abs(c.data.v))}` : undefined"
        >
          <span class="pcal__n num">{{ c.n }}</span>
          <span v-if="c.data" class="pcal__v num">{{ hidden ? '•••' : `${c.data.v >= 0 ? '+' : '−'}${formatCompact(Math.abs(c.data.v))}` }}</span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pcal__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.pcal__head strong { font-size: 14px; font-weight: var(--font-weight-semibold); text-transform: capitalize; }
.pcal__head button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--color-text-muted); }
.pcal__head button:hover:not(:disabled) { background: var(--fill-2); color: var(--color-text-default); }
.pcal__head button:disabled { opacity: 0.3; cursor: default; }
.pcal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.pcal__wd { padding: 4px 0; font-size: 11px; color: var(--color-text-dim); text-align: center; }
.pcal__cell { display: grid; align-content: space-between; min-height: 52px; padding: 6px 8px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); }
.pcal__cell.is-empty { background: none; }
.pcal__cell.is-up { background: color-mix(in srgb, var(--color-state-up) calc(var(--a) * 100%), var(--color-bg-surface-2)); }
.pcal__cell.is-down { background: color-mix(in srgb, var(--color-state-down) calc(var(--a) * 100%), var(--color-bg-surface-2)); }
.pcal__n { font-size: 11px; color: var(--color-text-muted); }
.pcal__v { font-size: 11px; font-weight: var(--font-weight-semibold); color: var(--color-text-default); }
.is-none .pcal__n { color: var(--color-text-dim); }
@media (max-width: 600px) { .pcal__cell { min-height: 44px; padding: 4px; } .pcal__v { font-size: 9.5px; } }
</style>
