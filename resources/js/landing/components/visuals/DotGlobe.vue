<script setup>
import { ref } from 'vue';
import { useCanvasLoop } from '../../composables/useCanvasLoop.js';

// A20 — globe en points : rotation lente, points plus lumineux vers l'avant,
// points d'activité pulsants. Chargé à la demande.
const props = defineProps({
  // Points d'activité : latitude / longitude en degrés.
  hotspots: {
    type: Array,
    default: () => [
      { lat: 14, lon: -17 },
      { lat: 6, lon: 2 },
      { lat: 34, lon: 40 },
      { lat: -12, lon: 96 },
      { lat: 44, lon: 170 },
      { lat: -30, lon: -110 },
    ],
  },
  speed: { type: Number, default: 0.1 }, // radians par seconde
});

const canvas = ref(null);
const RAD = Math.PI / 180;
const TILT = 0.38;
let points = [];
let colors = {};

function project(lat, lon, rot) {
  const cl = Math.cos(lat);
  const x = cl * Math.sin(lon + rot);
  const y0 = Math.sin(lat);
  const z0 = cl * Math.cos(lon + rot);
  // inclinaison autour de l'axe X
  return { x, y: y0 * Math.cos(TILT) - z0 * Math.sin(TILT), z: y0 * Math.sin(TILT) + z0 * Math.cos(TILT) };
}

useCanvasLoop(canvas, {
  fps: 30,
  setup({ token }) {
    colors = { a: token('--color-brand-primary-300'), b: token('--color-brand-secondary-300') };
    points = [];
    for (let lat = -84; lat <= 84; lat += 4) {
      const n = Math.max(6, Math.round(88 * Math.cos(lat * RAD)));
      for (let i = 0; i < n; i++) points.push({ lat: lat * RAD, lon: (i / n) * Math.PI * 2, alt: (lat / 4) % 2 === 0 });
    }
  },
  draw({ ctx, width, height, time }) {
    const r = Math.min(width, height) * 0.48;
    const cx = width / 2;
    const cy = height / 2;
    const rot = time * props.speed;
    ctx.clearRect(0, 0, width, height);

    for (const p of points) {
      const q = project(p.lat, p.lon, rot);
      if (q.z < -0.25) continue;
      ctx.globalAlpha = q.z > 0 ? 0.12 + q.z * 0.8 : 0.06;
      ctx.fillStyle = p.alt ? colors.a : colors.b;
      const s = 1 + Math.max(0, q.z) * 0.9;
      ctx.fillRect(cx + q.x * r - s / 2, cy - q.y * r - s / 2, s, s);
    }

    props.hotspots.forEach((h, i) => {
      const q = project(h.lat * RAD, h.lon * RAD, rot);
      if (q.z < 0.1) return;
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + i * 1.3);
      const x = cx + q.x * r;
      const y = cy - q.y * r;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10 + pulse * 12);
      glow.addColorStop(0, colors.a);
      glow.addColorStop(1, 'transparent');
      ctx.globalAlpha = q.z * (0.35 + pulse * 0.4);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10 + pulse * 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = q.z;
      ctx.fillStyle = colors.b;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  },
});
</script>

<template>
  <canvas ref="canvas" class="globe" aria-hidden="true" />
</template>

<style scoped>
.globe { width: 100%; height: 100%; }
</style>
