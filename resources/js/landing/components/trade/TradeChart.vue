<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { useCanvasLoop } from '../../composables/useCanvasLoop.js';

// Graphique en chandeliers : prix, volumes, moyennes mobiles 7 et 25, dernier cours, réticule.
// Dessiné à la demande (données ou pointeur qui changent), pas en boucle.
const props = defineProps({
  candles: { type: Array, required: true }, // [{ t, o, h, l, c, v }]
  version: { type: Number, default: 0 }, // change quand les données changent
  formatPrice: { type: Function, required: true },
  formatTime: { type: Function, required: true },
  label: { type: String, required: true },
});
const emit = defineEmits(['hover']);

const canvas = ref(null);
let colors = {};
let pointer = null; // { x, y } dans le canvas
const SPACING = 8;
const AXIS_W = 72;
const AXIS_H = 24;

function ma(list, i, n) {
  if (i < n - 1) return null;
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += list[k].c;
  return s / n;
}

const { redraw } = useCanvasLoop(canvas, {
  loop: false,
  setup({ token }) {
    colors = {
      up: token('--color-state-up'),
      down: token('--color-state-down'),
      grid: token('--color-line-default'),
      strong: token('--color-line-strong'),
      text: token('--color-text-muted'),
      dim: token('--color-text-dim'),
      ma7: token('--color-brand-primary-300'),
      ma25: token('--color-brand-secondary-300'),
      ink: token('--color-bg-base'),
      white: token('--color-text-default'),
      font: token('--font-family-sans'),
    };
  },
  draw({ ctx, width, height }) {
    const all = props.candles;
    ctx.clearRect(0, 0, width, height);
    if (!all.length) return;

    const plotW = width - AXIS_W;
    const volH = Math.round((height - AXIS_H) * 0.18);
    const priceH = height - AXIS_H - volH - 8;
    const count = Math.min(all.length, Math.floor((plotW - 12) / SPACING));
    const start = all.length - count;
    const view = all.slice(start);

    let hi = -Infinity;
    let lo = Infinity;
    let vmax = 0;
    for (const c of view) {
      hi = Math.max(hi, c.h);
      lo = Math.min(lo, c.l);
      vmax = Math.max(vmax, c.v);
    }
    const pad = (hi - lo) * 0.08 || hi * 0.001;
    hi += pad;
    lo -= pad;
    const y = (p) => 10 + ((hi - p) / (hi - lo)) * (priceH - 10);
    const x = (i) => plotW - 12 - (count - 1 - i) * SPACING - SPACING / 2;
    const bar = SPACING * 0.62;

    ctx.font = `10.5px ${colors.font}`;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    // Grille et axe des prix
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    for (let k = 0; k <= 4; k++) {
      const p = lo + ((hi - lo) * k) / 4;
      const gy = Math.round(y(p)) + 0.5;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(plotW, gy);
      ctx.stroke();
      ctx.fillText(props.formatPrice(p), plotW + 8, gy);
    }
    // Axe du temps
    const every = Math.ceil(110 / SPACING);
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.dim;
    for (let i = count - 1; i >= 0; i -= every) {
      const gx = Math.round(x(i)) + 0.5;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height - AXIS_H);
      ctx.stroke();
      ctx.fillText(props.formatTime(view[i].t), gx, height - AXIS_H / 2);
    }
    ctx.strokeStyle = colors.strong;
    ctx.beginPath();
    ctx.moveTo(plotW + 0.5, 0);
    ctx.lineTo(plotW + 0.5, height);
    ctx.moveTo(0, height - AXIS_H + 0.5);
    ctx.lineTo(width, height - AXIS_H + 0.5);
    ctx.stroke();

    // Volumes et chandeliers
    const volTop = height - AXIS_H - volH;
    view.forEach((c, i) => {
      const color = c.c >= c.o ? colors.up : colors.down;
      const cx = x(i);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      const vh = (c.v / vmax) * volH;
      ctx.fillRect(cx - bar / 2, volTop + volH - vh, bar, vh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(Math.round(cx) + 0.5, y(c.h));
      ctx.lineTo(Math.round(cx) + 0.5, y(c.l));
      ctx.stroke();
      const top = y(Math.max(c.o, c.c));
      ctx.fillRect(cx - bar / 2, top, bar, Math.max(1, y(Math.min(c.o, c.c)) - top));
    });

    // Moyennes mobiles
    for (const [n, color] of [[7, colors.ma7], [25, colors.ma25]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let started = false;
      view.forEach((_, i) => {
        const m = ma(all, start + i, n);
        if (m === null) return;
        started ? ctx.lineTo(x(i), y(m)) : ctx.moveTo(x(i), y(m));
        started = true;
      });
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Dernier cours
    const last = view[view.length - 1];
    const ly = Math.round(y(last.c)) + 0.5;
    const lastColor = last.c >= last.o ? colors.up : colors.down;
    ctx.strokeStyle = lastColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(plotW, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    tag(ctx, plotW, ly, props.formatPrice(last.c), lastColor, colors.ink);

    // Réticule
    let hovered = null;
    if (pointer && pointer.x < plotW && pointer.y < height - AXIS_H) {
      const i = Math.max(0, Math.min(count - 1, Math.round((pointer.x - x(0)) / SPACING)));
      hovered = view[i];
      const hx = Math.round(x(i)) + 0.5;
      const hy = Math.round(pointer.y) + 0.5;
      ctx.strokeStyle = colors.text;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height - AXIS_H);
      ctx.moveTo(0, hy);
      ctx.lineTo(plotW, hy);
      ctx.stroke();
      ctx.setLineDash([]);
      if (pointer.y < priceH) tag(ctx, plotW, hy, props.formatPrice(hi - ((pointer.y - 10) / (priceH - 10)) * (hi - lo)), colors.white, colors.ink);
    }
    emit('hover', hovered);
  },
});

function tag(ctx, x0, cy, text, bg, fg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x0 + 1, cy - 9, AXIS_W - 2, 18);
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.fillText(text, x0 + 8, cy);
}

watch(() => props.version, redraw);
function onMove(e) {
  const r = canvas.value.getBoundingClientRect();
  pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  redraw();
}
function onLeave() {
  pointer = null;
  redraw();
}
onBeforeUnmount(() => (pointer = null));
</script>

<template>
  <canvas ref="canvas" class="tchart" role="img" :aria-label="label" @pointermove="onMove" @pointerleave="onLeave" />
</template>

<style scoped>
.tchart { width: 100%; height: 100%; cursor: crosshair; touch-action: pan-y; }
</style>
