<script setup>
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

    <div v-reveal class="globe__media">
      <span class="globe__glow" aria-hidden="true" />
      <img :src="data.image.src" :width="data.image.width" :height="data.image.height" :alt="data.image.alt" loading="lazy" decoding="async" />
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
.globe__media { position: absolute; right: 0; top: 50%; width: min(820px, 54vw); transform: translateY(-50%); }
.globe__media img { display: block; width: 100%; height: auto; }
.globe__glow {
  position: absolute; inset: -30% -20%; z-index: -1; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-primary) 45%, transparent), transparent 70%); opacity: 0.55;
}
@media (max-width: 1100px) {
  .globe__media { position: relative; right: auto; top: auto; width: min(760px, 100%); margin: 48px auto 0; transform: none; }
}
</style>
