<script setup>
import { ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import FloatingCoins from '../visuals/FloatingCoins.vue';
import ShieldMark from '../visuals/ShieldMark.vue';
import ZIcon from '../ui/ZIcon.vue';

// Visuel des pages d'authentification. Le bouclier suit légèrement le pointeur.
defineProps({
  data: { type: Object, required: true }, // pages.login.visual | pages.signup.visual
  variant: { type: String, default: 'shield' }, // shield | perks
});

const root = ref(null);
let raf = 0;
function onMove(e) {
  if (prefersReducedMotion() || raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const r = root.value.getBoundingClientRect();
    root.value.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    root.value.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  });
}
function onLeave() {
  root.value.style.setProperty('--tx', 0);
  root.value.style.setProperty('--ty', 0);
}

const coins = [
  { glyph: '₮', x: 8, y: 6, size: 54, drift: 0, delay: 0 },
  { glyph: '₿', x: 78, y: -4, size: 62, drift: 0, delay: -1.6 },
  { glyph: 'F', x: 86, y: 76, size: 50, drift: 0, delay: -3 },
];
</script>

<template>
  <div ref="root" class="av" :class="`av--${variant}`" @pointermove="onMove" @pointerleave="onLeave">
    <div class="av__copy">
      <p v-split class="title av__title" v-html="data.title" />
      <p v-if="data.text" v-reveal class="av__text">{{ data.text }}</p>
    </div>

    <div v-if="variant === 'shield'" class="av__stage" aria-hidden="true">
      <div class="av__shield"><ShieldMark /></div>
    </div>

    <div v-else class="av__stage">
      <div class="av__card" v-reveal="300">
        <FloatingCoins :coins="coins" />
        <ul>
          <li v-for="p in data.perks" :key="p"><ZIcon name="check" :size="16" /> {{ p }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.av { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 56px 56px 48px; }
.av__title { font-size: clamp(32px, 3.4vw, 48px); }
.av__text { margin-top: 16px; max-width: 36ch; color: var(--color-text-muted); }
.av__stage { flex: 1; display: grid; place-items: center; perspective: 1000px; }
.av__shield {
  width: min(240px, 42%);
  transform: rotateX(calc(var(--ty, 0) * -18deg + 6deg)) rotateY(calc(var(--tx, 0) * 22deg));
  transition: transform 600ms var(--motion-ease-out);
  animation: av-float 6s ease-in-out infinite alternate;
}
.av__shield :deep(.shield) { filter: drop-shadow(0 40px 60px var(--ink)) drop-shadow(0 0 60px var(--glow-brand)); }
@keyframes av-float { from { translate: 0 -10px; } to { translate: 0 10px; } }

.av__card {
  position: relative; width: min(420px, 100%); padding: 32px 28px; border-radius: var(--radius-lg);
  background: linear-gradient(160deg, var(--fill-2), var(--fill-1));
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-line-strong); box-shadow: 0 40px 90px -30px var(--ink), 0 0 80px -30px var(--glow-brand);
  transform: rotateX(calc(var(--ty, 0) * -8deg)) rotateY(calc(var(--tx, 0) * 10deg)); transition: transform 600ms var(--motion-ease-out);
}
.av__card :deep(.coins) { inset: -40px; }
.av__card ul { position: relative; display: grid; gap: 18px; }
.av__card li { display: flex; gap: 12px; font-size: 15px; line-height: 1.4; }
.av__card li :deep(svg) { flex: none; margin-top: 2px; color: var(--color-state-up); }
@media (prefers-reduced-motion: reduce) { .av__shield { animation: none; } }
</style>
