<script setup>
import { computed, ref } from 'vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';
import AppVideo from '../visuals/AppVideo.vue';

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A12 — la vidéo monte légèrement à l'entrée de la section (--in, lié au scroll).
const stage = ref(null);
useScrollProgress(stage);

const half = computed(() => Math.ceil(props.data.perks.length / 2));
const sides = computed(() => [props.data.perks.slice(0, half.value), props.data.perks.slice(half.value)]);
</script>

<template>
  <section :id="data.id" class="section section--center app">
    <div class="container">
      <ZTag v-if="data.tag" v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title app__title" v-html="data.title" />
      <p v-reveal class="lede app__text">{{ data.text }}</p>
    </div>

    <div ref="stage" class="container app__stage">
      <ul v-for="(side, s) in sides" :key="s" class="app__perks" :class="s ? 'is-right' : 'is-left'">
        <li v-for="perk in side" :key="perk.title" v-reveal>
          <ZIconTile :icon="perk.icon" />
          <div>
            <h3>{{ perk.title }}</h3>
            <p>{{ perk.text }}</p>
          </div>
        </li>
      </ul>
      <div class="app__video">
        <AppVideo :video="data.video" :controls="false" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.app__title:not(:first-child) { margin-top: 26px; }
.app__text { margin-top: 22px; }
.app__stage {
  display: grid; grid-template-columns: minmax(0, 1fr) clamp(300px, 28vw, 400px) minmax(0, 1fr);
  grid-template-areas: 'left video right'; align-items: center; gap: 40px; margin-top: 32px;
}
.app__video { grid-area: video; transform: translateY(calc((1 - var(--in, 1)) * 18%)); }
/* Bas du téléphone fondu dans la page : l'animation paraît plus courte (≈ 18 % de hauteur en moins). */
.app__video :deep(.av) {
  -webkit-mask-image: linear-gradient(#000 62%, transparent 82%); mask-image: linear-gradient(#000 62%, transparent 82%);
  margin-bottom: -32%;
}
.app__perks { display: grid; gap: 34px; text-align: left; }
.app__perks.is-left { grid-area: left; justify-self: end; text-align: right; }
.app__perks.is-right { grid-area: right; justify-self: start; }
.app__perks li { display: flex; gap: 16px; max-width: 300px; }
.app__perks.is-left li { flex-direction: row-reverse; }
.app__perks h3 { font-size: 14px; font-weight: var(--font-weight-semibold); }
.app__perks p { font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 2px; }
/* Tablette et mobile : la vidéo d'abord, les avantages dessous sur deux colonnes. */
@media (max-width: 1100px) {
  .app__stage { grid-template-columns: 1fr 1fr; grid-template-areas: 'video video' 'left right'; gap: 28px 32px; }
  .app__video { justify-self: center; width: min(360px, 82vw); }
  .app__perks.is-left, .app__perks.is-right { justify-self: stretch; text-align: left; }
  .app__perks.is-left li { flex-direction: row; }
  .app__perks li { max-width: none; }
}
@media (max-width: 560px) {
  .app__stage { grid-template-columns: 1fr; grid-template-areas: 'video' 'left' 'right'; row-gap: 22px; }
}
@media (prefers-reduced-motion: reduce) { .app__video { transform: none; } }
</style>
