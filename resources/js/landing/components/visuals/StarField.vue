<script setup>
import { ref } from 'vue';
import { seededRandom, useCanvasLoop } from '../../composables/useCanvasLoop.js';

// Ciel étoilé des pages de connexion : étoiles qui scintillent et dérivent lentement.
const canvas = ref(null);
let stars = [];
let colors = [];

useCanvasLoop(canvas, {
  fps: 24,
  setup({ width, height, token }) {
    const rand = seededRandom(5);
    colors = [token('--color-text-default'), token('--color-brand-primary-300'), token('--color-brand-secondary-300')];
    stars = Array.from({ length: Math.round((width * height) / 2600) }, () => ({
      x: rand() * width,
      y: rand() * height,
      r: rand() < 0.92 ? 0.4 + rand() * 0.8 : 1.3 + rand() * 1.2,
      a: 0.25 + rand() * 0.7,
      tw: 0.6 + rand() * 2.2, // vitesse de scintillement
      ph: rand() * Math.PI * 2,
      c: rand() < 0.85 ? 0 : rand() < 0.5 ? 1 : 2,
    }));
  },
  draw({ ctx, width, height, time }) {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const y = (s.y - time * 4 * s.r + height) % height; // dérive verticale lente, plus rapide pour les grandes
      ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(time * s.tw + s.ph));
      ctx.fillStyle = colors[s.c];
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
});
</script>

<template>
  <canvas ref="canvas" class="stars" aria-hidden="true" />
</template>

<style scoped>
.stars { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
