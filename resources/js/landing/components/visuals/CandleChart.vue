<script setup>
import { ref } from 'vue';
import { seededRandom, useCanvasLoop } from '../../composables/useCanvasLoop.js';

// A5 — chandeliers + moyenne mobile dessinés de gauche à droite, puis dernière bougie vivante.
// DÉMO : série générée (déterministe). Passez `candles` pour brancher de vraies données.
const props = defineProps({
  candles: { type: Array, default: null }, // [{ o, h, l, c, v }]
  delay: { type: Number, default: 0 }, // secondes avant le tracé
  duration: { type: Number, default: 1.8 },
  seed: { type: Number, default: 4 },
});

const canvas = ref(null);
let series = [];
let colors = {};

function demoSeries() {
  const rand = seededRandom(props.seed);
  const out = [];
  let price = 20;
  for (let i = 0; i < 46; i++) {
    const trend = i < 26 ? 2.6 : 0.15; // hausse puis plateau
    const o = price;
    const c = o + trend + (rand() - 0.42) * 4.2;
    out.push({ o, c, h: Math.max(o, c) + rand() * 2.4, l: Math.min(o, c) - rand() * 2.4, v: 0.25 + rand() * 0.75 });
    price = c;
  }
  return out;
}

useCanvasLoop(canvas, {
  fps: 30,
  setup({ token }) {
    series = props.candles ?? demoSeries();
    colors = {
      up: token('--color-state-up'),
      down: token('--color-state-down'),
      line: token('--color-brand-primary-300'),
      grid: token('--color-line-default'),
    };
  },
  draw({ ctx, width, height, time, reduced }) {
    const progress = reduced ? 1 : Math.min(1, Math.max(0, (time - props.delay) / props.duration));
    const eased = 1 - (1 - progress) ** 3;
    const chartH = height * 0.74;
    const volH = height * 0.16;
    const data = series.map((d) => ({ ...d }));
    if (progress === 1 && !reduced) {
      // la dernière bougie bouge en continu
      const last = data[data.length - 1];
      last.c += Math.sin(time * 1.7) * 1.6 + Math.sin(time * 4.3) * 0.5;
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
    }
    const min = Math.min(...data.map((d) => d.l));
    const max = Math.max(...data.map((d) => d.h));
    const step = width / data.length;
    const bar = Math.max(2, step * 0.5);
    const y = (v) => chartH - ((v - min) / (max - min)) * (chartH - 12) - 4;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const gy = Math.round((chartH / 3.4) * i) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width * eased, height);
    ctx.clip();

    data.forEach((d, i) => {
      const x = i * step + step / 2;
      const color = d.c >= d.o ? colors.up : colors.down;
      ctx.strokeStyle = ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y(d.h));
      ctx.lineTo(x, y(d.l));
      ctx.stroke();
      const top = y(Math.max(d.o, d.c));
      ctx.fillRect(x - bar / 2, top, bar, Math.max(1.5, y(Math.min(d.o, d.c)) - top));
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x - bar / 2, height - d.v * volH, bar, d.v * volH);
      ctx.globalAlpha = 1;
    });

    // moyenne mobile (5 périodes)
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((_, i) => {
      const from = Math.max(0, i - 4);
      const avg = data.slice(from, i + 1).reduce((s, d) => s + d.c, 0) / (i + 1 - from);
      const x = i * step + step / 2;
      i ? ctx.lineTo(x, y(avg) + 6) : ctx.moveTo(x, y(avg) + 6);
    });
    ctx.stroke();
    ctx.restore();
  },
});
</script>

<template>
  <!-- Le canvas est posé en absolu : sa taille ne peut pas repousser la grille qui le contient. -->
  <div class="candles-box"><canvas ref="canvas" class="candles" aria-hidden="true" /></div>
</template>

<style scoped>
.candles-box { position: relative; min-height: 0; height: 100%; }
.candles { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
</style>
