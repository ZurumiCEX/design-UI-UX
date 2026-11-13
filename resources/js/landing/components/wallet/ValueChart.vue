<script setup>
import { computed, ref } from 'vue';
import { useWidth } from '../../composables/useWidth.js';

// Évolution de la valeur du portefeuille : une série, aire légère, ligne de 2 px,
// réticule qui se cale sur le jour le plus proche (souris, toucher ou flèches du clavier).
const props = defineProps({
  points: { type: Array, required: true }, // [{ t, v }]
  formatValue: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  label: { type: String, required: true },
  hidden: { type: Boolean, default: false }, // solde masqué : axes et infobulle masqués aussi
});
const box = ref(null);
const width = useWidth(box);
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 64 };
const active = ref(-1);

const scale = computed(() => {
  const vs = props.points.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  const pad = (hi - lo) * 0.12 || hi * 0.02;
  lo -= pad;
  hi += pad;
  const w = width.value - PAD.left - PAD.right;
  const h = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / Math.max(1, props.points.length - 1)) * w;
  const y = (v) => PAD.top + (1 - (v - lo) / (hi - lo)) * h;
  const ticks = [0, 1, 2, 3].map((k) => lo + ((hi - lo) * k) / 3);
  return { x, y, ticks };
});
const line = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${scale.value.x(i).toFixed(1)} ${scale.value.y(p.v).toFixed(1)}`).join(' '));
const area = computed(() => `${line.value} L${scale.value.x(props.points.length - 1)} ${H - PAD.bottom} L${PAD.left} ${H - PAD.bottom} Z`);
const xTicks = computed(() => {
  const n = props.points.length;
  const count = Math.min(5, n);
  return Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / Math.max(1, count - 1)));
});
const point = computed(() => props.points[active.value]);
const up = computed(() => props.points.at(-1).v >= props.points[0].v);

function onMove(e) {
  const r = box.value.getBoundingClientRect();
  const w = width.value - PAD.left - PAD.right;
  const i = Math.round(((e.clientX - r.left - PAD.left) / w) * (props.points.length - 1));
  active.value = Math.max(0, Math.min(props.points.length - 1, i));
}
function onKey(e) {
  const n = props.points.length;
  if (e.key === 'ArrowLeft') active.value = Math.max(0, (active.value < 0 ? n : active.value) - 1);
  else if (e.key === 'ArrowRight') active.value = Math.min(n - 1, active.value + 1);
  else if (e.key === 'Home') active.value = 0;
  else if (e.key === 'End') active.value = n - 1;
  else return;
  e.preventDefault();
}
const tipLeft = computed(() => (point.value ? Math.min(width.value - 170, Math.max(0, scale.value.x(active.value) - 80)) : 0));
</script>

<template>
  <div
    ref="box"
    class="vchart"
    :class="up ? 'is-up' : 'is-down'"
    tabindex="0"
    role="img"
    :aria-label="label"
    @pointermove="onMove"
    @pointerleave="active = -1"
    @keydown="onKey"
    @blur="active = -1"
  >
    <svg :width="width" :height="H" aria-hidden="true">
      <defs>
        <linearGradient :id="`vg-${label.length}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color: var(--color-brand-primary-300); stop-opacity: 0.22" />
          <stop offset="1" style="stop-color: var(--color-brand-primary-300); stop-opacity: 0" />
        </linearGradient>
      </defs>
      <g class="vchart__grid">
        <template v-for="tk in scale.ticks" :key="tk">
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="scale.y(tk)" :y2="scale.y(tk)" />
          <text :x="PAD.left - 10" :y="scale.y(tk) + 4" text-anchor="end">{{ hidden ? '•••' : formatValue(tk) }}</text>
        </template>
        <text v-for="i in xTicks" :key="`x${i}`" :x="scale.x(i)" :y="H - 8" :text-anchor="i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'">{{ formatDate(points[i].t) }}</text>
      </g>
      <path :d="area" :fill="`url(#vg-${label.length})`" />
      <path :d="line" class="vchart__line" />
      <template v-if="point">
        <line class="vchart__cross" :x1="scale.x(active)" :x2="scale.x(active)" :y1="PAD.top" :y2="H - PAD.bottom" />
        <circle class="vchart__dot" :cx="scale.x(active)" :cy="scale.y(point.v)" r="5" />
      </template>
    </svg>
    <div v-if="point" class="vchart__tip" :style="{ left: `${tipLeft}px` }" aria-live="polite">
      <strong class="num">{{ hidden ? '••••••' : formatValue(point.v) }}</strong>
      <span>{{ formatDate(point.t) }}</span>
    </div>
  </div>
</template>

<style scoped>
.vchart { position: relative; width: 100%; border-radius: var(--radius-md); touch-action: pan-y; }
.vchart:focus-visible { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 4px; }
.vchart svg { display: block; overflow: visible; }
.vchart__grid line { stroke: var(--color-line-default); }
.vchart__grid text { fill: var(--color-text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
.vchart__line { fill: none; stroke: var(--color-brand-primary-300); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.vchart__cross { stroke: var(--color-text-muted); stroke-dasharray: 3 3; }
.vchart__dot { fill: var(--color-brand-primary-300); stroke: var(--color-bg-surface); stroke-width: 2; }
.vchart__tip {
  position: absolute; top: 0; width: 160px; padding: 8px 12px; border-radius: var(--radius-sm); pointer-events: none;
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); box-shadow: 0 12px 30px -12px var(--ink);
  display: grid; gap: 2px; font-size: 12px; color: var(--color-text-muted);
}
.vchart__tip strong { font-size: 14px; color: var(--color-text-default); }
</style>
