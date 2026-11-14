<script setup>
import { ref } from 'vue';
import { useCanvasLoop } from '../../composables/useCanvasLoop.js';
import world from './world.json';

// A20 — globe en points, gros plan sur l'Afrique de l'Ouest : côtes, frontières des pays du réseau,
// et paiements entre capitales tirés au hasard. Chaque arc se trace, puis un médaillon (photo de profil
// + drapeau du pays destinataire) apparaît en 1,5 s ; il s'efface quand la transaction suivante démarre.
// Une seule transaction à l'écran à la fois : l'animation reste sobre et laisse les cartes de cours lisibles.
const props = defineProps({
  focus: { type: Object, default: () => ({ lat: 11, lon: -7 }) }, // point du globe au centre de l'image
  zoom: { type: Number, default: 1.75 }, // 1 = globe entier
  sway: { type: Number, default: 2.5 }, // léger balancement est-ouest (degrés)
  // Capitales du réseau (lat, lon, drapeau). Abidjan pour la Côte d'Ivoire (capitale économique).
  cities: {
    type: Array,
    default: () => [
      { iso: 'sn', at: [14.69, -17.45] }, // Dakar
      { iso: 'mr', at: [18.08, -15.98] }, // Nouakchott
      { iso: 'gm', at: [13.45, -16.58] }, // Banjul
      { iso: 'gn', at: [9.64, -13.58] }, // Conakry
      { iso: 'ml', at: [12.64, -8.0] }, // Bamako
      { iso: 'ci', at: [5.32, -4.03] }, // Abidjan
      { iso: 'bf', at: [12.37, -1.52] }, // Ouagadougou
      { iso: 'tg', at: [6.13, 1.22] }, // Lomé
      { iso: 'bj', at: [6.37, 2.43] }, // Cotonou
    ],
  },
  avatars: { type: Array, default: () => ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((a) => `/images/avatars/${a}.svg`) },
});

const canvas = ref(null);
const RAD = Math.PI / 180;
const TRAVEL = 1.5; // s : tracé de l'arc
const POP = 1.5; // s : apparition du médaillon (demandé : 1,5 s)
const HOLD = 0.9; // s : médaillon affiché avant la transaction suivante
const OUT = 0.4; // s : disparition du médaillon une fois l'arc suivant lancé

let dots = []; // { cl, sl, co, so, land }
let coasts = [];
let borders = []; // { focus, rings: [[cl, sl, co, so], …] }
let colors = {};
let tx = null; // { from, to, route, start, avatar }
let prev = null; // transaction précédente (médaillon en train de disparaître)
const images = { avatars: [], flags: {} };

// ---------- Projection orthographique ----------
let s0 = 0, c0 = 1, sl0 = 0, cl0 = 1;
function proj(cl, sl, co, so) {
  const sinL = so * c0 - co * s0, cosL = co * c0 + so * s0;
  const x = cl * sinL, y0 = sl, z0 = cl * cosL;
  return [x, y0 * cl0 - z0 * sl0, y0 * sl0 + z0 * cl0];
}
const unit = (lat, lon) => [Math.cos(lat * RAD), Math.sin(lat * RAD), Math.cos(lon * RAD), Math.sin(lon * RAD)];
const toVec = ([lat, lon]) => { const cl = Math.cos(lat * RAD); return [cl * Math.sin(lon * RAD), Math.sin(lat * RAD), cl * Math.cos(lon * RAD)]; };
function projVec([x, y, z]) {
  const xr = x * c0 - z * s0, zr = x * s0 + z * c0;
  return [xr, y * cl0 - zr * sl0, y * sl0 + zr * cl0];
}
// Grand cercle entre deux villes, légèrement soulevé au milieu.
function route(a, b) {
  const va = toVec(a), vb = toVec(b);
  const om = Math.acos(Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))), so = Math.sin(om) || 1;
  const lift = 0.012 + om * 0.28, pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so, h = 1 + lift * Math.sin(Math.PI * t);
    pts.push([(va[0] * ka + vb[0] * kb) * h, (va[1] * ka + vb[1] * kb) * h, (va[2] * ka + vb[2] * kb) * h]);
  }
  return pts;
}

// ---------- Données ----------
const decodeRing = (r, q) => { const out = []; let x = 0, y = 0; for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; out.push(unit(y / q, x / q)); } return out; };
function decode() {
  const G = world.region.grid;
  const inRegion = (lat, lon) => lat >= G.lat0 && lat <= G.lat1 && lon >= G.lon0 && lon <= G.lon1;
  // grille mondiale (hors zone) : clairsemée
  const bits = Uint8Array.from(atob(world.land), (c) => c.charCodeAt(0));
  dots = [];
  let k = 0;
  for (let lat = -84; lat <= 84; lat += world.grid.step) {
    const n = Math.max(6, Math.round(world.grid.k * Math.cos(lat * RAD)));
    for (let i = 0; i < n; i++, k++) {
      let lon = (i / n) * 360; if (lon > 180) lon -= 360;
      if (inRegion(lat, lon)) continue;
      dots.push({ ...toDot(lat, lon), land: (bits[k >> 3] >> (k & 7)) & 1 });
    }
  }
  // grille dense de la zone (gros plan)
  const rb = Uint8Array.from(atob(G.land), (c) => c.charCodeAt(0));
  k = 0;
  for (let la = G.lat0; la <= G.lat1 + 1e-9; la += G.step) for (let lo = G.lon0; lo <= G.lon1 + 1e-9; lo += G.step, k++) dots.push({ ...toDot(la, lo), land: (rb[k >> 3] >> (k & 7)) & 1, fine: true });
  coasts = world.rings.map((r) => decodeRing(r, world.q));
  borders = world.region.countries.map((c) => ({ focus: c.focus, rings: c.rings.map((r) => decodeRing(r, world.region.q)) }));
}
function toDot(lat, lon) { const [cl, sl, co, so] = unit(lat, lon); return { cl, sl, co, so }; }
function loadImages() {
  if (images.avatars.length) return;
  const load = (src) => { const im = new Image(); im.decoding = 'async'; im.src = src; return im; };
  images.avatars = props.avatars.map(load);
  for (const c of props.cities) images.flags[c.iso] = load(`/images/flags/${c.iso}.svg`);
}

// ---------- Transactions ----------
let lastPair = '';
function nextTx(time) {
  const n = props.cities.length;
  let a, b, key;
  do {
    a = Math.floor(Math.random() * n);
    b = Math.floor(Math.random() * n);
    key = `${a}-${b}`;
  } while (a === b || key === lastPair || (tx && b === tx.to)); // jamais deux fois la même destination de suite
  lastPair = key;
  prev = tx;
  tx = { from: a, to: b, route: route(props.cities[a].at, props.cities[b].at), start: time, avatar: Math.floor(Math.random() * images.avatars.length) };
}

// ---------- Dessin ----------
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeBack = (t) => { const c = 1.6; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
let G = { cx: 0, cy: 0, r: 1 };
const screen = (v) => { const [x, y, z] = projVec(v); return [G.cx + x * G.r, G.cy - y * G.r, z]; };

function strokeRings(ctx, rings) {
  ctx.beginPath();
  for (const ring of rings) {
    let pen = false;
    for (const p of ring) {
      const [x, y, z] = proj(p[0], p[1], p[2], p[3]);
      if (z < 0.02) { pen = false; continue; }
      const X = G.cx + x * G.r, Y = G.cy - y * G.r;
      pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      pen = true;
    }
  }
}

function drawArc(ctx, t, alpha) {
  const pts = tx.route, last = Math.max(1, Math.floor(t * (pts.length - 1))), tail = t < 1 ? Math.max(0, last - 20) : 0;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  let prevP = null;
  for (let i = tail; i <= last; i++) {
    const P = screen(pts[i]);
    if (prevP) {
      const k = t < 1 ? (i - tail) / (last - tail || 1) : 1;
      ctx.globalAlpha = alpha * (t < 1 ? 0.15 + 0.85 * k : 0.55);
      ctx.strokeStyle = t < 1 && k > 0.6 ? colors.b : colors.a;
      ctx.beginPath(); ctx.moveTo(prevP[0], prevP[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
    }
    prevP = P;
  }
  if (t < 1 && prevP) {
    const g = ctx.createRadialGradient(prevP[0], prevP[1], 0, prevP[0], prevP[1], 10);
    g.addColorStop(0, colors.b); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.85 * alpha; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(prevP[0], prevP[1], 10, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alpha; ctx.fillStyle = colors.ink;
    ctx.beginPath(); ctx.arc(prevP[0], prevP[1], 2, 0, Math.PI * 2); ctx.fill();
  }
}

// Médaillon : photo de profil + drapeau à droite. k = progression d'apparition (0 → 1), fade = opacité globale.
function drawBadge(ctx, t, k, fade) {
  const [x, y] = screen(toVec(props.cities[t.to].at));
  const av = images.avatars[t.avatar], fl = images.flags[props.cities[t.to].iso];
  const s = 0.55 + 0.45 * easeBack(Math.min(1, k / 0.55)); // pop
  const a = Math.min(1, k / 0.35) * fade;
  // onde au point d'arrivée
  ctx.globalAlpha = (1 - Math.min(1, k)) * 0.7 * fade;
  ctx.strokeStyle = colors.b; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, 3 + easeOut(Math.min(1, k)) * 22, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = fade; ctx.fillStyle = colors.b;
  ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
  if (!av?.complete || !fl?.complete) return;
  const R = 17 * s, bx = x, by = y - 30 * s; // au-dessus du point
  ctx.save();
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.fillStyle = colors.paper;
  ctx.beginPath(); ctx.arc(bx, by, R + 2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(av, bx - R, by - R, R * 2, R * 2); ctx.restore();
  // drapeau à droite, légèrement décalé dans le temps
  const fk = Math.max(0, Math.min(1, (k - 0.25) / 0.5)), fw = 22 * s, fh = 15 * s, fx = bx + R + 4 * s - (1 - easeOut(fk)) * 6, fy = by - fh / 2;
  ctx.globalAlpha = a * easeOut(fk);
  ctx.fillStyle = colors.paper;
  roundRect(ctx, fx - 1.5, fy - 1.5, fw + 3, fh + 3, 4); ctx.fill();
  ctx.save(); roundRect(ctx, fx, fy, fw, fh, 3); ctx.clip(); ctx.drawImage(fl, fx, fy, fw, fh); ctx.restore();
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

useCanvasLoop(canvas, {
  fps: 40,
  setup({ token }) {
    colors = { a: token('--color-brand-primary-300'), b: token('--color-brand-secondary-300'), ink: token('--color-text-default'), paper: token('--color-paper') };
    if (!dots.length) decode();
    loadImages();
  },
  draw({ ctx, width, height, time, reduced }) {
    G = { cx: width * 0.5, cy: height * 0.5, r: Math.min(width, height) * 0.48 * props.zoom };
    const lon0 = props.focus.lon + (reduced ? 0 : Math.sin(time * 0.12) * props.sway);
    s0 = Math.sin(lon0 * RAD); c0 = Math.cos(lon0 * RAD);
    sl0 = Math.sin(props.focus.lat * RAD); cl0 = Math.cos(props.focus.lat * RAD);
    ctx.clearRect(0, 0, width, height);

    // bord de la sphère
    ctx.globalAlpha = 0.16; ctx.strokeStyle = colors.b; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(G.cx, G.cy, G.r, 0, Math.PI * 2); ctx.stroke();

    // points : terres plus présentes que l'océan
    for (const d of dots) {
      const [x, y, z] = proj(d.cl, d.sl, d.co, d.so);
      if (z < 0) continue;
      const X = G.cx + x * G.r, Y = G.cy - y * G.r;
      if (X < -4 || X > width + 4 || Y < -4 || Y > height + 4) continue;
      if (d.land) { ctx.globalAlpha = 0.18 + z * 0.42; ctx.fillStyle = colors.a; const s = d.fine ? 1.5 : 1.8; ctx.fillRect(X - s / 2, Y - s / 2, s, s); }
      else { ctx.globalAlpha = 0.03 + z * 0.08; ctx.fillStyle = colors.b; ctx.fillRect(X - 0.5, Y - 0.5, 1, 1); }
    }

    // côtes, frontières des voisins, puis pays du réseau (remplissage très léger)
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.4; ctx.strokeStyle = colors.b; ctx.lineWidth = 1;
    strokeRings(ctx, coasts); ctx.stroke();
    ctx.globalAlpha = 0.16; ctx.lineWidth = 0.8;
    strokeRings(ctx, borders.filter((c) => !c.focus).flatMap((c) => c.rings)); ctx.stroke();
    const focusRings = borders.filter((c) => c.focus).flatMap((c) => c.rings);
    strokeRings(ctx, focusRings);
    ctx.globalAlpha = 0.06; ctx.fillStyle = colors.a; ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = colors.a; ctx.lineWidth = 1; ctx.stroke();

    // capitales
    ctx.fillStyle = colors.ink;
    for (const c of props.cities) {
      const [x, y, z] = screen(toVec(c.at));
      if (z < 0.05) continue;
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    if (reduced) {
      // mouvement réduit : une transaction figée, médaillon affiché
      if (!tx) { loadImages(); tx = { from: 0, to: 5, route: route(props.cities[0].at, props.cities[5].at), start: 0, avatar: 0 }; }
      drawArc(ctx, 1, 1);
      drawBadge(ctx, tx, 1, 1);
      ctx.globalAlpha = 1;
      return;
    }
    if (!tx) nextTx(time);
    const el = time - tx.start;
    // médaillon de la transaction précédente : s'efface au départ de la suivante
    if (prev) {
      const f = 1 - (time - tx.start) / OUT;
      if (f > 0) { drawBadge(ctx, prev, 1, f); } else prev = null;
    }
    drawArc(ctx, Math.min(1, el / TRAVEL), 1);
    if (el >= TRAVEL) drawBadge(ctx, tx, (el - TRAVEL) / POP, 1);
    if (el >= TRAVEL + POP + HOLD) nextTx(time);
    ctx.globalAlpha = 1;
  },
});
</script>

<template>
  <canvas ref="canvas" class="globe" aria-hidden="true" />
</template>

<style scoped>
.globe {
  width: 100%;
  height: 100%;
  /* gros plan : les bords du globe se fondent dans la page */
  mask-image: radial-gradient(closest-side, #000 72%, transparent 100%);
}
</style>
