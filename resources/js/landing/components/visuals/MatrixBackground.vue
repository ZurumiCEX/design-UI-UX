<script setup>
import { ref } from 'vue';
import { seededRandom, useCanvasLoop } from '../../composables/useCanvasLoop.js';

// A7 — colonnes de 0/1 qui tombent lentement, très faible opacité, masque radial.
const canvas = ref(null);
const COL = 24;
const ROW = 20;
let columns = [];
let color = '';

useCanvasLoop(canvas, {
  fps: 14,
  setup({ width, height, token }) {
    const rand = seededRandom(11);
    color = token('--color-brand-secondary-300');
    const rows = Math.ceil(height / ROW) + 2;
    columns = Array.from({ length: Math.ceil(width / COL) }, () => ({
      speed: 6 + rand() * 14, // px par seconde
      offset: rand() * ROW * rows,
      glyphs: Array.from({ length: rows }, () => (rand() < 0.55 ? { c: rand() < 0.5 ? '0' : '1', a: 0.15 + rand() * 0.6 } : null)),
    }));
  },
  draw({ ctx, width, height, time }) {
    ctx.clearRect(0, 0, width, height);
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = color;
    columns.forEach((col, i) => {
      const span = col.glyphs.length * ROW;
      col.glyphs.forEach((g, r) => {
        if (!g) return;
        ctx.globalAlpha = g.a;
        ctx.fillText(g.c, i * COL + 6, ((r * ROW + col.offset + time * col.speed) % span) - ROW);
      });
    });
    ctx.globalAlpha = 1;
  },
});
</script>

<template>
  <canvas ref="canvas" class="matrix" aria-hidden="true" />
</template>

<style scoped>
.matrix {
  position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.2; pointer-events: none;
  mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 100%);
}
</style>
