<script setup>
import { computed, ref } from 'vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';
import PhoneMock from '../visuals/PhoneMock.vue';

const props = defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A12 — disque et téléphone liés au scroll via --in.
const stage = ref(null);
useScrollProgress(stage);

const half = computed(() => Math.ceil(props.data.perks.length / 2));
const sides = computed(() => [props.data.perks.slice(0, half.value), props.data.perks.slice(half.value)]);
</script>

<template>
  <section :id="data.id" class="section section--center app">
    <div class="container">
      <ZTag v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title app__title" v-html="data.title" />
      <p v-reveal class="lede app__text">{{ data.text }}</p>
    </div>

    <div ref="stage" class="app__stage">
      <div class="app__disc" aria-hidden="true" />
      <ul v-for="(side, s) in sides" :key="s" class="app__perks" :class="s ? 'is-right' : 'is-left'">
        <li v-for="perk in side" :key="perk.title" v-reveal>
          <ZIconTile :icon="perk.icon" />
          <div>
            <h3>{{ perk.title }}</h3>
            <p>{{ perk.text }}</p>
          </div>
        </li>
      </ul>
      <div class="app__phone">
        <PhoneMock :screen="data.phone" :brand="common.brand" :image="data.image" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.app { padding-bottom: 0; }
.app__title { margin-top: 26px; }
.app__text { margin-top: 22px; }
.app__stage { position: relative; height: 590px; margin-top: 40px; overflow: hidden; display: flex; justify-content: center; }
.app__disc {
  position: absolute; left: 50%; top: 190px; width: 920px; height: 920px; margin-left: -460px; border-radius: 50%;
  background: radial-gradient(circle at 28% 22%, var(--color-sky-bottom), var(--color-brand-secondary) 34%, var(--color-brand-primary) 62%, var(--color-bg-surface));
  transform: translateY(calc((1 - var(--in, 1)) * 46%)) scale(calc(0.55 + 0.45 * var(--in, 1)));
  transform-origin: 50% 0;
}
.app__phone { position: relative; margin-top: 200px; transform: translateY(calc((1 - var(--in, 1)) * 62%)); }
.app__perks { position: absolute; top: 132px; z-index: 1; display: grid; gap: 26px; width: 300px; text-align: left; }
.app__perks.is-left { right: calc(50% + 190px); text-align: right; }
.app__perks.is-right { left: calc(50% + 190px); }
.app__perks li { display: flex; gap: 16px; }
.app__perks.is-left li { flex-direction: row-reverse; }
.app__perks h3 { font-size: 14px; font-weight: var(--font-weight-semibold); }
.app__perks p { font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 2px; }
@media (max-width: 1100px) { .app__perks { display: none; } }
@media (max-width: 900px) {
  .app__stage { height: 500px; }
  .app__disc { width: 640px; height: 640px; margin-left: -320px; }
}
</style>
