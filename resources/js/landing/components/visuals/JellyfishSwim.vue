<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import pulse from './meduse-pulse.json';

// Méduse qui nage librement dans la section (adapté du kit « méduse »).
// Fluidité : on n'écrit que transform et opacity (composités par le GPU, sans flou recalculé
// à chaque image), les dimensions sont mesurées au redimensionnement et non à chaque image,
// et la poussée suit les contractions de l'ombrelle (pulse.json) avec interpolation.
const props = defineProps({
  media: { type: Object, required: true }, // { webm, mp4, poster }
  // Zone de nage verticale (part de la hauteur de la section) : laisse le titre lisible.
  top: { type: Number, default: 0.3 },
  bottom: { type: Number, default: 0.86 },
});

const RATIO = 528 / 512; // hauteur / largeur de la vidéo
const reduced = prefersReducedMotion();
// Safari et iOS ignorent la transparence du WebM : MP4 sur fond noir + fusion « screen ».
const webkitOnly = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent));

const stage = ref(null);
const body = ref(null);
const video = ref(null);
const loaded = ref(false);

let W = 0, H = 0, size = 0; // dimensions mises en cache (ResizeObserver)
let raf = 0, last = 0, visible = false;
let io, ro;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
function makeNoise() {
  const f = [rand(0.05, 0.09), rand(0.11, 0.17), rand(0.23, 0.31)];
  const p = [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)];
  return (t) => Math.sin(t * f[0] * 6.283 + p[0]) * 0.55 + Math.sin(t * f[1] * 6.283 + p[1]) * 0.3 + Math.sin(t * f[2] * 6.283 + p[2]) * 0.15;
}

// État de la nage
const s = { x: null, y: 0, vx: 0, vy: 0, z: rand(0.45, 0.9), zTarget: 0.7, tilt: 0, yaw: 0, t: rand(0, 100), target: null, retarget: 0 };
const nx = makeNoise(), ny = makeNoise(), nz = makeNoise(), nh = makeNoise();

// Poussée interpolée entre deux échantillons : pas d'à-coups quand currentTime avance par paliers.
function thrust() {
  const v = video.value;
  if (!v || !v.duration) return 0.35;
  const f = (v.currentTime % pulse.duration) * pulse.fps;
  const i = Math.floor(f), n = pulse.thrust.length;
  return lerp(pulse.thrust[i % n] ?? 0, pulse.thrust[(i + 1) % n] ?? 0, f - i);
}

function bounds(scale) {
  const w = size * scale, h = w * RATIO;
  return { w, mw: w * 0.42, top: H * props.top + h * 0.1, bottom: H * props.bottom - h * 0.25 };
}
function pickTarget(b) {
  let tx = s.x < W / 2 ? rand(Math.max(W * 0.55, b.mw), W - b.mw) : rand(b.mw, Math.min(W * 0.45, W - b.mw));
  if (Math.random() < 0.2) tx = rand(b.mw, W - b.mw);
  s.target = { x: tx, y: rand(b.top, Math.max(b.top, b.bottom)) };
  s.retarget = rand(10, 18);
  s.zTarget = rand(0.3, 1);
}

function step(dt) {
  const scale = lerp(0.6, 1.05, s.z);
  const b = bounds(scale);
  if (s.x === null) {
    s.x = rand(b.mw, W - b.mw);
    s.y = rand(b.top, Math.max(b.top, b.bottom));
    pickTarget(b);
  }
  s.t += dt;
  s.retarget -= dt;
  let dx = s.target.x - s.x, dy = s.target.y - s.y;
  if (Math.hypot(dx, dy) < b.w * 0.35 || s.retarget <= 0) {
    pickTarget(b);
    dx = s.target.x - s.x;
    dy = s.target.y - s.y;
  }
  // cap vers le point visé, courbé par un bruit organique ; la poussée suit l'ombrelle
  const heading = Math.atan2(dy, dx) + nh(s.t) * 0.6;
  const base = 52 * clamp(W / 1200, 0.6, 1.6) * lerp(0.7, 1.1, s.z);
  const push = thrust();
  const spd = base * (0.45 + 1.9 * push);
  const tvx = Math.cos(heading) * spd;
  const tvy = Math.sin(heading) * spd - push * base * 0.9 + (1 - push) * base * 0.18;
  s.vx = damp(s.vx, tvx, 1.6, dt);
  s.vy = damp(s.vy, tvy, 1.6, dt);
  // murs souples
  const k = 3;
  if (s.x < b.mw) s.vx += (b.mw - s.x) * k * dt;
  if (s.x > W - b.mw) s.vx -= (s.x - (W - b.mw)) * k * dt;
  if (s.y < b.top) s.vy += (b.top - s.y) * k * dt;
  if (s.y > b.bottom) s.vy -= (s.y - b.bottom) * k * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.z = damp(s.z, clamp(s.zTarget + nz(s.t) * 0.12, 0.25, 1), 0.25, dt);
  s.tilt = damp(s.tilt, clamp(s.vx / (base * 2.2), -1, 1) * 22, 2.2, dt);
  s.yaw = damp(s.yaw, clamp(s.vx / (base * 2.5), -1, 1) * 12, 1.5, dt);
  const bob = Math.sin(s.t * 1.1) * 3 + ny(s.t) * 4;

  const el = body.value;
  const tx = s.x - size / 2, ty = s.y - size * 0.28 + bob; // ancrage sur l'ombrelle (~28 % du haut)
  el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) perspective(900px) rotateZ(${s.tilt.toFixed(2)}deg) rotateY(${s.yaw.toFixed(2)}deg) rotateX(${(nx(s.t) * 6).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  el.style.opacity = lerp(0.72, 1, s.z).toFixed(3); // profondeur : plus loin = plus pâle (sans flou)
}

function loop(ts) {
  raf = requestAnimationFrame(loop);
  if (!last) { last = ts; return; }
  const dt = Math.min((ts - last) / 1000, 0.05); // pas de saut après un onglet en arrière-plan
  last = ts;
  if (W && size) step(dt);
}
function start() {
  if (reduced || raf) return;
  last = 0;
  raf = requestAnimationFrame(loop);
  video.value?.play().catch(() => {});
}
function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
  video.value?.pause();
}
function measure() {
  W = stage.value.clientWidth;
  H = stage.value.clientHeight;
  size = body.value.offsetWidth;
}

onMounted(() => {
  ro = new ResizeObserver(measure);
  ro.observe(stage.value);
  measure();
  io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !loaded.value) loaded.value = true; // chargement à l'approche
      visible = entry.intersectionRatio > 0;
      visible ? start() : stop();
    },
    { rootMargin: '400px 0px', threshold: [0] },
  );
  io.observe(stage.value);
  document.addEventListener('visibilitychange', onVisibility);
});
function onVisibility() {
  document.hidden ? stop() : visible && start();
}
onBeforeUnmount(() => {
  stop();
  io?.disconnect();
  ro?.disconnect();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <div ref="stage" class="jelly-stage" aria-hidden="true">
    <div ref="body" class="jelly" :class="{ 'is-still': reduced, 'is-screen': webkitOnly }">
      <video
        v-if="loaded"
        ref="video"
        class="jelly__video"
        :poster="media.poster"
        :src="webkitOnly ? media.mp4 : media.webm"
        muted
        loop
        playsinline
        disablepictureinpicture
        preload="auto"
        width="512"
        height="528"
        @canplay="visible && !reduced && video.play().catch(() => {})"
      />
    </div>
  </div>
</template>

<style scoped>
.jelly-stage { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.jelly {
  position: absolute; left: 0; top: 0; width: clamp(364px, 42vw, 672px); /* +40 % */ aspect-ratio: 512 / 528;
  transform-origin: 50% 28%; will-change: transform, opacity; contain: layout paint;
  opacity: 0; /* invisible jusqu'à la première image calculée */
}
.jelly.is-screen { mix-blend-mode: screen; }
.jelly__video { display: block; width: 100%; height: 100%; object-fit: contain; }
/* Mouvement réduit : la méduse reste immobile, à droite du centre, sur une image fixe. */
.jelly.is-still { left: 62%; top: 38%; opacity: 1; }
</style>
