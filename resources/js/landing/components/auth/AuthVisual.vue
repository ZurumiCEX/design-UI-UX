<script setup>
import { ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import AppVideo from '../visuals/AppVideo.vue';
import ShieldMark from '../visuals/ShieldMark.vue';

// Visuel des pages d'authentification. Connexion : image (cadenas et clé) qui suit légèrement le pointeur.
// Inscription : vidéo de pièces (fond transparent), sans bouton lecture / pause.
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

</script>

<template>
  <div ref="root" class="av" :class="`av--${variant}`" @pointermove="onMove" @pointerleave="onLeave">
    <div class="av__copy">
      <p v-split class="title av__title" v-html="data.title" />
      <p v-if="data.text" v-reveal class="av__text">{{ data.text }}</p>
    </div>

    <div v-if="variant === 'shield'" class="av__stage" aria-hidden="true">
      <div class="av__shield" :class="{ 'is-image': data.image }">
        <img v-if="data.image" :src="data.image.src" :width="data.image.width" :height="data.image.height" alt="" decoding="async" />
        <ShieldMark v-else />
      </div>
    </div>

    <div v-else class="av__stage">
      <div v-if="data.video" class="av__video"><AppVideo :video="data.video" :controls="false" /></div>
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
.av__shield.is-image { width: min(400px, 72%); }
.av__shield img { display: block; width: 100%; height: auto; filter: drop-shadow(0 40px 60px var(--ink)) drop-shadow(0 0 70px color-mix(in srgb, var(--glow-brand) 60%, transparent)); }
.av__video { width: min(560px, 100%); margin: 0 auto; }
.av--perks .av__stage { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.av__shield :deep(.shield) { filter: drop-shadow(0 40px 60px var(--ink)) drop-shadow(0 0 60px var(--glow-brand)); }
@keyframes av-float { from { translate: 0 -10px; } to { translate: 0 10px; } }

@media (prefers-reduced-motion: reduce) { .av__shield { animation: none; } }
</style>
