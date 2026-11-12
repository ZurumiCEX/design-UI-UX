import { onBeforeUnmount, onMounted } from 'vue';
import { prefersReducedMotion } from './useReducedMotion.js';

// Un seul listener de scroll pour toute la page, limité par requestAnimationFrame.
// Il écrit des variables CSS ; le CSS fait le reste.
//   --in : 0 → 1 pendant l'entrée de l'élément (décélération cubique)
//   --p  : 0 → 1 pendant toute la traversée du viewport
//   --sy : 0 → 1 sur la première hauteur d'écran (sur <html>)
const elements = new Set();
const callbacks = new Set();
let bound = false;
let ticking = false;

const clamp = (v) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  const y = window.scrollY;
  document.documentElement.style.setProperty('--sy', clamp(y / vh).toFixed(4));
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -vh || rect.top > vh * 2) continue; // loin de l'écran : rien à écrire
    el.style.setProperty('--in', easeOutCubic(clamp((vh - rect.top) / (vh * 0.85))).toFixed(4));
    el.style.setProperty('--p', clamp((vh - rect.top) / (vh + rect.height)).toFixed(4));
  }
  for (const cb of callbacks) cb(y);
}

function request() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
}

function unbindIfIdle() {
  if (!bound || elements.size || callbacks.size) return;
  bound = false;
  window.removeEventListener('scroll', request);
  window.removeEventListener('resize', request);
}

export function trackScroll(el) {
  if (prefersReducedMotion()) {
    el.style.setProperty('--in', '1');
    el.style.setProperty('--p', '0.5');
    return () => {};
  }
  elements.add(el);
  bind();
  request();
  return () => {
    elements.delete(el);
    unbindIfIdle();
  };
}

export function onScrollFrame(cb) {
  callbacks.add(cb);
  bind();
  request();
  return () => {
    callbacks.delete(cb);
    unbindIfIdle();
  };
}

/** Expose --in et --p sur l'élément référencé pendant la vie du composant. */
export function useScrollProgress(elRef) {
  let stop;
  onMounted(() => elRef.value && (stop = trackScroll(elRef.value)));
  onBeforeUnmount(() => stop?.());
}

/** Rappel à chaque image de scroll (ex. : état « défilé » de la navigation). */
export function useScrollFrame(cb) {
  let stop;
  onMounted(() => (stop = onScrollFrame(cb)));
  onBeforeUnmount(() => stop?.());
}
