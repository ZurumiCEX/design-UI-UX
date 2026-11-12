<script setup>
import { ref } from 'vue';
import { seededRandom, useCanvasLoop } from '../../composables/useCanvasLoop.js';

// Pluie fine de la bannière ciel (A13). Chargé à la demande.
const canvas = ref(null);
let drops = [];
let color = '';

useCanvasLoop(canvas, {
  fps: 40,
  setup({ width, height, token }) {
    const rand = seededRandom(23);
    color = token('--color-text-default');
    drops = Array.from({ length: Math.round(width / 16) }, () => ({
      x: rand() * width,
      y: rand() * height,
      len: 12 + rand() * 22,
      speed: 90 + rand() * 140,
      alpha: 0.08 + rand() * 0.22,
    }));
  },
  draw({ ctx, width, height, time }) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (const d of drops) {
      const y = ((d.y + time * d.speed) % (height + d.len)) - d.len;
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(Math.round(d.x) + 0.5, y);
      ctx.lineTo(Math.round(d.x) + 0.5, y + d.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
});
</script>

<template>
  <canvas ref="canvas" class="rain" aria-hidden="true" />
</template>

<style scoped>
.rain { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
