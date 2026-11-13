<script setup>
import { ref } from 'vue';
import { useCanvasLoop } from '../../composables/useCanvasLoop.js';
import world from './world.json';

// A20 — globe en points centré sur l'Afrique : contours des continents, points plus denses sur
// les terres, et paiements transfrontaliers entre villes africaines — un arc se trace, atterrit,
// puis la transaction suivante part. Volontairement sobre : les cartes de cours restent lisibles.
const props = defineProps({
  focus: { type: Object, default: () => ({ lat: 3, lon: 15 }) }, // point du globe face à l'écran
  sway: { type: Number, default: 9 }, // balancement est-ouest (degrés), l'Afrique reste de face
  // Villes reliées par les transactions (lat / lon en degrés).
  cities: {
    type: Array,
    default: () => [
      [14.69, -17.45], // Dakar
      [5.32, -4.03], // Abidjan
      [12.64, -8.0], // Bamako
      [12.37, -1.52], // Ouagadougou
      [6.13, 1.22], // Lomé
      [6.37, 2.43], // Cotonou
      [13.51, 2.11], // Niamey
      [9.64, -13.58], // Conakry
      [6.52, 3.38], // Lagos
      [5.6, -0.19], // Accra
      [4.05, 9.7], // Douala
      [-4.32, 15.31], // Kinshasa
      [-8.84, 13.23], // Luanda
      [-1.29, 36.82], // Nairobi
      [9.03, 38.74], // Addis-Abeba
      [-26.2, 28.05], // Johannesburg
      [33.57, -7.59], // Casablanca
      [30.04, 31.24], // Le Caire
    ],
  },
});

const canvas = ref(null);
const RAD = Math.PI / 180;
const TRAVEL = 1.9; // s : tracé d'un paiement
const LAND = 0.9; // s : onde à l'arrivée
const GAP = 0.35; // s : pause avant la transaction suivante
const HISTORY = 3; // arcs précédents encore visibles (en s'effaçant)

let dots = []; // { cl, sl, co, so, land }
let coasts = []; // [[cl, sl, co, so], …] par contour
let cities = [];
let colors = {};
let tx = null; // transaction en cours
const past = []; // { route, end }

// Point unitaire → coordonnées écran, pour un centre (lat0 via sin/cos, lon0 via sin/cos).
let s0 = 0, c0 = 1, sl0 = 0, cl0 = 1;
function proj(cl, sl, co, so) {
  // λ = lon − lon0
  const sinL = so * c0 - co * s0;
  const cosL = co * c0 + so * s0;
  const x = cl * sinL;
  const y0 = sl, z0 = cl * cosL;
  return [x, y0 * cl0 - z0 * sl0, y0 * sl0 + z0 * cl0];
}
const unit = (lat, lon) => [Math.cos(lat * RAD), Math.sin(lat * RAD), Math.cos(lon * RAD), Math.sin(lon * RAD)];

// Grand cercle entre deux villes, soulevé au milieu (arc au-dessus du globe).
function route(a, b) {
  const va = toVec(a), vb = toVec(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const om = Math.acos(dot), so = Math.sin(om) || 1;
  const n = 48, pts = [];
  const lift = 0.06 + om * 0.32;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so;
    const h = 1 + lift * Math.sin(Math.PI * t);
    pts.push([(va[0] * ka + vb[0] * kb) * h, (va[1] * ka + vb[1] * kb) * h, (va[2] * ka + vb[2] * kb) * h]);
  }
  return { pts, to: b };
}
// vecteur 3D (x vers l'est à lon 0, y vers le nord, z vers lon 0)
function toVec([lat, lon]) {
  const cl = Math.cos(lat * RAD);
  return [cl * Math.sin(lon * RAD), Math.sin(lat * RAD), cl * Math.cos(lon * RAD)];
}
function projVec([x, y, z]) {
  // même rotation que proj(), appliquée à un vecteur 3D
  const xr = x * c0 - z * s0;
  const zr = x * s0 + z * c0;
  return [xr, y * cl0 - zr * sl0, y * sl0 + zr * cl0];
}

function nextTx(time, from) {
  const a = from ?? Math.floor(Math.random() * cities.length);
  let b = a;
  while (b === a) b = Math.floor(Math.random() * cities.length);
  tx = { route: route(cities[a], cities[b]), to: b, start: time };
}

function decode() {
  const bits = Uint8Array.from(atob(world.land), (c) => c.charCodeAt(0));
  dots = [];
  let k = 0;
  for (let lat = -84; lat <= 84; lat += world.grid.step) {
    const n = Math.max(6, Math.round(world.grid.k * Math.cos(lat * RAD)));
    for (let i = 0; i < n; i++, k++) {
      const lon = (i / n) * 360;
      const [cl, sl, co, so] = unit(lat, lon);
      dots.push({ cl, sl, co, so, land: (bits[k >> 3] >> (k & 7)) & 1 });
    }
  }
  coasts = world.rings.map((r) => {
    const out = [];
    let x = 0, y = 0;
    for (let i = 0; i < r.length; i += 2) {
      x += r[i];
      y += r[i + 1];
      out.push(unit(y / world.q, x / world.q));
    }
    return out;
  });
}

useCanvasLoop(canvas, {
  fps: 40,
  setup({ token }) {
    colors = { a: token('--color-brand-primary-300'), b: token('--color-brand-secondary-300'), ink: token('--color-text-default') };
    if (!dots.length) decode();
    cities = props.cities;
  },
  draw({ ctx, width, height, time, reduced }) {
    const r = Math.min(width, height) * 0.48;
    const cx = width / 2, cy = height / 2;
    const lon0 = props.focus.lon + (reduced ? 0 : Math.sin(time * 0.11) * props.sway);
    s0 = Math.sin(lon0 * RAD); c0 = Math.cos(lon0 * RAD);
    sl0 = Math.sin(props.focus.lat * RAD); cl0 = Math.cos(props.focus.lat * RAD);
    ctx.clearRect(0, 0, width, height);

    // limbe discret
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = colors.b;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // points : terres plus présentes que les océans
    for (const d of dots) {
      const [x, y, z] = proj(d.cl, d.sl, d.co, d.so);
      if (z < 0) continue;
      if (d.land) {
        ctx.globalAlpha = 0.2 + z * 0.6;
        ctx.fillStyle = colors.a;
        const s = 1.1 + z * 0.9;
        ctx.fillRect(cx + x * r - s / 2, cy - y * r - s / 2, s, s);
      } else {
        ctx.globalAlpha = 0.03 + z * 0.1;
        ctx.fillStyle = colors.b;
        ctx.fillRect(cx + x * r - 0.5, cy - y * r - 0.5, 1, 1);
      }
    }

    // contours des continents (face visible seulement)
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = colors.b;
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const ring of coasts) {
      let pen = false;
      for (const p of ring) {
        const [x, y, z] = proj(p[0], p[1], p[2], p[3]);
        if (z < 0.02) { pen = false; continue; }
        const X = cx + x * r, Y = cy - y * r;
        pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        pen = true;
      }
    }
    ctx.stroke();

    // villes du réseau
    ctx.fillStyle = colors.ink;
    for (const c of cities) {
      const [x, y, z] = projVec(toVec(c));
      if (z < 0.05) continue;
      ctx.globalAlpha = 0.35 * z;
      ctx.beginPath();
      ctx.arc(cx + x * r, cy - y * r, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // paiements : arcs précédents qui s'effacent, puis l'arc en cours
    if (reduced) {
      if (!tx) tx = { route: route(cities[0], cities[1]), to: 1, start: -TRAVEL };
      drawArc(ctx, cx, cy, r, tx.route.pts, 1, 0.5, false);
      ctx.globalAlpha = 1;
      return;
    }
    if (!tx) nextTx(time);
    for (let i = past.length - 1; i >= 0; i--) {
      const fade = 1 - (time - past[i].end) / 4;
      if (fade <= 0) { past.splice(i, 1); continue; }
      drawArc(ctx, cx, cy, r, past[i].route.pts, 1, 0.16 * fade, false);
    }
    const t = (time - tx.start) / TRAVEL;
    drawArc(ctx, cx, cy, r, tx.route.pts, Math.min(1, t), 0.75, t < 1);
    if (t >= 1) {
      // onde d'arrivée
      const k = (time - tx.start - TRAVEL) / LAND;
      if (k <= 1) {
        const [x, y, z] = projVec(toVec(cities[tx.to]));
        if (z > 0) {
          ctx.globalAlpha = (1 - k) * 0.7 * z;
          ctx.strokeStyle = colors.b;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx + x * r, cy - y * r, 3 + k * 16, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (time - tx.start > TRAVEL + LAND + GAP) {
        past.push({ route: tx.route, end: time });
        if (past.length > HISTORY) past.shift();
        // la transaction suivante part souvent de la ville qui vient de recevoir
        nextTx(time, Math.random() < 0.6 ? tx.to : undefined);
      }
    }
    ctx.globalAlpha = 1;
  },
});

// Trace la partie [0, t] d'un arc ; la tête est lumineuse, la traîne s'estompe.
function drawArc(ctx, cx, cy, r, pts, t, alpha, head) {
  const last = Math.max(1, Math.floor(t * (pts.length - 1)));
  const tail = head ? Math.max(0, last - 22) : 0;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  let prev = null;
  for (let i = tail; i <= last; i++) {
    const [x, y, z] = projVec(pts[i]);
    const P = [cx + x * r, cy - y * r, z];
    if (prev && prev[2] > -0.05 && z > -0.05) {
      const k = head ? (i - tail) / (last - tail || 1) : 1;
      ctx.globalAlpha = alpha * (head ? 0.15 + 0.85 * k : 1);
      ctx.strokeStyle = head && k > 0.6 ? colors.b : colors.a;
      ctx.beginPath();
      ctx.moveTo(prev[0], prev[1]);
      ctx.lineTo(P[0], P[1]);
      ctx.stroke();
    }
    prev = P;
  }
  if (head && prev && prev[2] > 0) {
    const g = ctx.createRadialGradient(prev[0], prev[1], 0, prev[0], prev[1], 9);
    g.addColorStop(0, colors.b);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(prev[0], prev[1], 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(prev[0], prev[1], 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
</script>

<template>
  <canvas ref="canvas" class="globe" aria-hidden="true" />
</template>

<style scoped>
.globe { width: 100%; height: 100%; }
</style>
