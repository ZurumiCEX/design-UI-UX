<script setup>
import { computed, ref } from 'vue';
import { useWidth } from '../../composables/useWidth.js';

// P&L quotidien : barres de part et d'autre d'une ligne zéro (gain vers le haut, perte vers le bas),
// extrémité arrondie côté donnée, 2 px d'écart, infobulle par barre (souris ou clavier).
const props = defineProps({
  days: { type: Array, required: true }, // [{ t, v, pct }]
  formatValue: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  formatPct: { type: Function, required: true },
  label: { type: String, required: true },
  hidden: { type: Boolean, default: false },
});
const box = ref(null);
const width = useWidth(box);
const H = 240;
const PAD = { top: 16, bottom: 28, left: 64, right: 12 };
const active = ref(-1);

const geo = computed(() => {
  const max = Math.max(...props.days.map((d) => Math.abs(d.v))) || 1;
  const h = H - PAD.top - PAD.bottom;
  const zero = PAD.top + h / 2;
  const step = (width.value - PAD.left - PAD.right) / props.days.length;
  const bw = Math.min(28, Math.max(2, step - 2)); // marques fines : 28 px au plus
  return {
    zero, step, bw, max,
    bars: props.days.map((d, i) => {
      const len = Math.max(1, (Math.abs(d.v) / max) * (h / 2));
      return { x: PAD.left + i * step + (step - bw) / 2, y: d.v >= 0 ? zero - len : zero, h: len, up: d.v >= 0 };
    }),
  };
});
// Barre arrondie (4 px) uniquement côté donnée, ancrée sur la ligne zéro.
function path(b) {
  const r = Math.min(4, b.bw / 2, b.h);
  const { x, y, h } = b;
  const w = geo.value.bw;
  return b.up
    ? `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`
    : `M${x} ${y}V${y + h - r}Q${x} ${y + h} ${x + r} ${y + h}H${x + w - r}Q${x + w} ${y + h} ${x + w} ${y + h - r}V${y}Z`;
}
const day = computed(() => props.days[active.value]);
function onKey(e) {
  const n = props.days.length;
  if (e.key === 'ArrowLeft') active.value = Math.max(0, (active.value < 0 ? n : active.value) - 1);
  else if (e.key === 'ArrowRight') active.value = Math.min(n - 1, active.value + 1);
  else return;
  e.preventDefault();
}
const tipLeft = computed(() => Math.min(width.value - 170, Math.max(0, PAD.left + active.value * geo.value.step - 80)));
</script>

<template>
  <div ref="box" class="pbars" tabindex="0" role="img" :aria-label="label" @keydown="onKey" @blur="active = -1" @pointerleave="active = -1">
    <svg :width="width" :height="H" aria-hidden="true">
      <g class="pbars__axis">
        <text :x="PAD.left - 10" :y="PAD.top + 4" text-anchor="end">{{ hidden ? '•••' : `+${formatValue(geo.max)}` }}</text>
        <text :x="PAD.left - 10" :y="geo.zero + 4" text-anchor="end">0</text>
        <text :x="PAD.left - 10" :y="H - PAD.bottom + 4" text-anchor="end">{{ hidden ? '•••' : `−${formatValue(geo.max)}` }}</text>
        <line :x1="PAD.left" :x2="width - PAD.right" :y1="geo.zero" :y2="geo.zero" class="pbars__zero" />
        <text :x="PAD.left" :y="H - 8">{{ formatDate(days[0].t) }}</text>
        <text :x="width - PAD.right" :y="H - 8" text-anchor="end">{{ formatDate(days.at(-1).t) }}</text>
      </g>
      <g>
        <g v-for="(b, i) in geo.bars" :key="i" @pointerenter="active = i">
          <rect :x="PAD.left + i * geo.step" :y="PAD.top" :width="geo.step" :height="H - PAD.top - PAD.bottom" fill="transparent" />
          <path :d="path({ ...b, bw: geo.bw })" :class="[b.up ? 'is-up' : 'is-down', { 'is-active': i === active }]" />
        </g>
      </g>
    </svg>
    <div v-if="day" class="pbars__tip" :style="{ left: `${tipLeft}px` }" aria-live="polite">
      <strong class="num" :class="day.v >= 0 ? 'is-up' : 'is-down'">{{ hidden ? '••••' : `${day.v >= 0 ? '+' : '−'}${formatValue(Math.abs(day.v))}` }}</strong>
      <span class="num">{{ formatPct(day.pct) }} · {{ formatDate(day.t) }}</span>
    </div>
  </div>
</template>

<style scoped>
.pbars { position: relative; width: 100%; border-radius: var(--radius-md); }
.pbars:focus-visible { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 4px; }
.pbars svg { display: block; overflow: visible; }
.pbars__axis text { fill: var(--color-text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
.pbars__zero { stroke: var(--color-line-strong); }
path.is-up { fill: var(--color-state-up); }
path.is-down { fill: var(--color-state-down); }
path { opacity: 0.85; transition: opacity 120ms; }
path.is-active { opacity: 1; stroke: var(--color-text-default); stroke-width: 1; }
.pbars__tip { position: absolute; top: 0; width: 160px; padding: 8px 12px; border-radius: var(--radius-sm); pointer-events: none; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); display: grid; gap: 2px; font-size: 12px; color: var(--color-text-muted); }
.pbars__tip strong { font-size: 14px; }
</style>
