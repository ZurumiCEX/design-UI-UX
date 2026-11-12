import { onBeforeUnmount, onMounted } from 'vue';
import { prefersReducedMotion } from './useReducedMotion.js';

const MAX_DPR = 2;

/**
 * Boucle requestAnimationFrame pour un <canvas> :
 * plafonnée en images/seconde et en densité de pixels, en pause hors écran,
 * image fixe si l'utilisateur demande un mouvement réduit.
 *
 * @param canvasRef ref du <canvas>
 * @param options.fps    images par seconde (14 à 40 selon le visuel)
 * @param options.setup  ({ width, height, token }) appelé à chaque redimensionnement
 * @param options.draw   ({ ctx, width, height, time, reduced, token })
 */
export function useCanvasLoop(canvasRef, { fps = 30, setup, draw }) {
  const reduced = prefersReducedMotion();
  let ctx, io, ro, styles;
  let raf = 0;
  let last = 0;
  let start = 0;
  let width = 0;
  let height = 0;

  // Lit un token CSS : les canvas n'ont aucune couleur en dur.
  const token = (name) => styles.getPropertyValue(name).trim();

  function frame(now = performance.now()) {
    if (!width || !height) return;
    draw({ ctx, width, height, time: (now - start) / 1000, reduced, token });
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now - last < 1000 / fps) return;
    last = now;
    frame(now);
  }

  function play() {
    if (!raf && !reduced) raf = requestAnimationFrame(tick);
  }

  function pause() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function resize() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setup?.({ width, height, token });
    frame();
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    ctx = canvas.getContext('2d');
    styles = getComputedStyle(canvas);
    start = performance.now();
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (reduced) return;
    io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
    io.observe(canvas);
  });

  onBeforeUnmount(() => {
    pause();
    io?.disconnect();
    ro?.disconnect();
  });
}

/** Générateur pseudo-aléatoire déterministe (mêmes visuels à chaque chargement). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
