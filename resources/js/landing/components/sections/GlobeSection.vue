<script setup>
import AppVideo from '../visuals/AppVideo.vue';
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';

// Section « portefeuille partout » : texte, fonctionnalités et visuel coffre + carte.
defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});
</script>

<template>
  <section :id="data.id" class="section globe">
    <div class="container globe__layout">
      <div class="globe__copy">
        <ZTag v-if="data.tag" v-reveal>{{ data.tag }}</ZTag>
        <h2 v-split class="title globe__title" v-html="data.title" />
        <p v-reveal class="lede globe__text">{{ data.text }}</p>
        <ul class="globe__features">
          <li v-for="f in data.features" :key="f.label" v-reveal>
            <ZIconTile :icon="f.icon" :size="26" /> {{ f.label }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Bulles liquides (vidéo à fond transparent) et deux encadrés de chiffres en HTML. -->
    <div v-reveal class="globe__media">
      <span class="globe__glow" aria-hidden="true" />
      <div class="globe__vault"><AppVideo :video="data.video" :controls="false" /></div>
      <div v-for="(s, i) in data.stats" :key="s.label" class="globe__stat theme-dark" :class="`is-${i}`">
        <span>{{ s.label }}</span>
        <strong class="num">{{ s.value }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.globe { position: relative; overflow: hidden; padding-bottom: calc(var(--space-section-y) * 1.1); }
.globe__layout { position: relative; z-index: 1; }
.globe__copy { max-width: 560px; }
.globe__title:not(:first-child) { margin-top: 30px; }
.globe__title { font-size: clamp(38px, 5.8vw, 80px); }
.globe__text { margin-top: 26px; }
.globe__features { display: grid; gap: 16px; margin-top: 44px; font-size: 14px; }
.globe__features li { display: flex; align-items: center; gap: 14px; }
/* Visuel large (coffre, carte, indicateurs) : à droite, jusqu'au bord de l'écran, sur un halo violet discret. */
.globe__media { position: absolute; right: 0; top: 50%; width: min(820px, 54vw); aspect-ratio: 2000 / 789; transform: translateY(-50%); container-type: inline-size; }
/* Positions reprises de l'image d'origine (2000 × 789) pour garder la même composition. */
.globe__vault { position: absolute; left: 17%; top: -4%; width: 72%; }
.globe__stat {
  position: absolute; display: grid; align-content: center; gap: 0.6cqi; padding: 0 1.8cqi; height: 11.2cqi; min-width: 17cqi; white-space: nowrap;
  border-radius: 1cqi; border: 1px solid color-mix(in srgb, var(--color-text-default) 14%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-text-default) 22%, var(--color-bg-surface)), color-mix(in srgb, var(--color-brand-primary) 30%, var(--color-bg-surface)));
  box-shadow: 0 2cqi 4cqi -2cqi var(--ink); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.globe__stat span { font-size: max(8.5px, 1.25cqi); color: color-mix(in srgb, var(--color-brand-secondary-300) 85%, var(--color-text-default)); }
.globe__stat strong { font-size: 4.4cqi; font-weight: 300; line-height: 1; letter-spacing: -0.02em; color: var(--color-text-default); }
.globe__stat.is-0 { left: 0.4%; top: 29.5%; animation: globe-drift 8s ease-in-out infinite alternate; }
.globe__stat.is-1 { right: 2.6%; top: 5.7%; animation: globe-drift 9s ease-in-out -3s infinite alternate-reverse; }
@keyframes globe-drift { from { transform: translate(-0.6cqi, -1.4cqi); } to { transform: translate(0.6cqi, 1.4cqi); } }
@media (prefers-reduced-motion: reduce) { .globe__stat { animation: none; } }
.globe__glow {
  position: absolute; inset: -30% -20%; z-index: -1; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-primary) 45%, transparent), transparent 70%); opacity: 0.55;
}
@media (max-width: 1100px) {
  .globe__media { position: relative; right: auto; top: auto; width: min(760px, 100%); margin: 48px auto 0; transform: none; }
}
</style>
