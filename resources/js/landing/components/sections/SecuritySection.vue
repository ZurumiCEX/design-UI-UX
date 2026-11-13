<script setup>
import { ref } from 'vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';
import ShieldMark from '../visuals/ShieldMark.vue';

defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A16 — rotation 3D du bouclier liée au scroll via --p.
const root = ref(null);
useScrollProgress(root);
const hovered = ref(-1);
</script>

<template>
  <section :id="data.id" ref="root" class="section security">
    <div class="container security__layout">
      <div>
        <ZTag v-if="data.tag" v-reveal>{{ data.tag }}</ZTag>
        <h2 v-split class="title security__title" v-html="data.title" />
        <div class="security__shield"><ShieldMark :image="data.image" /></div>
      </div>

      <ul class="security__grid">
        <li
          v-for="(item, i) in data.items"
          :key="item.title"
          v-reveal
          class="guard"
          @mouseenter="hovered = i"
          @mouseleave="hovered = -1"
        >
          <img v-if="item.image" class="guard__icon" :src="item.image" width="256" height="256" alt="" loading="lazy" decoding="async" />
          <ZIconTile v-else :icon="item.icon" :active="hovered === i" />
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.security__layout { display: grid; grid-template-columns: minmax(0, 0.94fr) minmax(0, 1fr); gap: 40px; }
.security__title:not(:first-child) { margin-top: 26px; }
.security__shield {
  width: 260px; margin: 56px 0 0 36px; perspective: 900px;
}
.security__shield :deep(svg) {
  transform: rotateX(calc(34deg - 26deg * var(--p, 0.5))) rotateZ(calc(-14deg + 10deg * var(--p, 0.5)));
}
/* Rendu 3D (cadenas, fond transparent) : léger flottement lié au scroll. */
.security__shield:has(img) { width: 300px; margin-top: 40px; perspective: none; }
.security__shield :deep(img) {
  display: block; width: 100%; height: auto;
  transform: translateY(calc((0.5 - var(--p, 0.5)) * 40px)) rotate(calc(-5deg + 10deg * var(--p, 0.5)));
}
@media (prefers-reduced-motion: reduce) { .security__shield :deep(img) { transform: none; } }
/* fond à fines hachures */
.security__grid {
  display: grid; grid-template-columns: 1fr 1fr; align-self: start;
  background: repeating-linear-gradient(135deg, transparent 0 7px, var(--fill-1) 7px 8px);
  border-left: 1px solid var(--color-line-default);
}
.guard {
  position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; min-height: 252px; padding: 22px;
  border-right: 1px solid var(--color-line-default); border-bottom: 1px solid var(--color-line-default);
}
.guard:nth-child(even) { border-right: 0; }
/* Icône 3D centrée dans la carte ; elle se soulève légèrement au survol. */
.guard__icon {
  display: block; align-self: center; width: 120px; height: 120px; margin-top: 6px; object-fit: contain;
  filter: drop-shadow(0 16px 24px color-mix(in srgb, var(--color-brand-primary) 30%, transparent));
  transition: transform var(--duration-rule) var(--motion-ease-out);
}
.guard:hover .guard__icon { transform: translateY(-4px) scale(1.04); }
.guard h3 { font-size: 14px; font-weight: var(--font-weight-semibold); }
.guard p { font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 4px; }
/* A17 — fond en léger dégradé + repère vertical gauche. */
.guard::before {
  content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0;
  background: linear-gradient(160deg, color-mix(in srgb, var(--color-brand-primary) 22%, transparent), transparent 70%);
  transition: opacity var(--motion-duration-hover);
}
.guard::after {
  content: ''; position: absolute; left: -1px; top: 22px; width: 1px; height: 30px; background: var(--color-text-dim);
  transform-origin: 0 0; transition: transform var(--duration-rule) var(--motion-ease-out), background-color var(--motion-duration-hover);
}
.guard:hover::before { opacity: 1; }
.guard:hover::after { transform: scaleY(3.2); background: var(--color-brand-primary-300); }
@media (prefers-reduced-motion: reduce) { .guard:hover .guard__icon { transform: none; } }
@media (max-width: 900px) {
  .security__layout { grid-template-columns: 1fr; }
  .security__shield { width: 200px; margin: 40px auto 8px; }
  .security__grid { grid-template-columns: 1fr; }
  .guard, .guard:nth-child(even) { min-height: 0; gap: 24px; border-right: 0; }
  .guard__icon { width: 104px; height: 104px; }
}
</style>
