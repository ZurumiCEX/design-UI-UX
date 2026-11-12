<script setup>
import { ref } from 'vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import ZButton from '../ui/ZButton.vue';
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';
import FloatingCoins from '../visuals/FloatingCoins.vue';
import PhoneMock from '../visuals/PhoneMock.vue';

defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A15 — pièces et téléphone couché liés au scroll via --p.
const stage = ref(null);
useScrollProgress(stage);
</script>

<template>
  <section :id="data.id" class="section section--center mm">
    <div class="container">
      <ZTag v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title mm__title" v-html="data.title" />
      <p v-reveal class="lede mm__text">{{ data.text }}</p>

      <div ref="stage" class="mm__stage">
        <template v-if="!data.image">
          <div class="mm__phone"><PhoneMock variant="lying" /></div>
        </template>
        <FloatingCoins :coins="data.floating" :image="data.image" />
      </div>

      <ul class="mm__perks">
        <li v-for="perk in data.perks" :key="perk.title" v-reveal>
          <ZIconTile :icon="perk.icon" />
          <div>
            <h3>{{ perk.title }}</h3>
            <p>{{ perk.text }}</p>
          </div>
        </li>
      </ul>

      <ZButton v-reveal size="lg" :href="data.cta.href">{{ data.cta.label }}</ZButton>
    </div>
  </section>
</template>

<style scoped>
.mm__title { margin-top: 26px; max-width: 16em; margin-inline: auto; }
.mm__text { margin-top: 22px; }
.mm__stage { position: relative; width: min(560px, 100%); height: 340px; margin: 40px auto 56px; perspective: 1200px; }
.mm__phone { position: absolute; left: 50%; top: 58%; margin-left: -162px; transform: rotateX(22deg) rotateZ(calc(-8deg + 16deg * var(--p, 0.5))); }
.mm__perks { display: grid; grid-template-columns: repeat(3, minmax(0, 260px)); justify-content: center; gap: 28px 40px; margin-bottom: 48px; text-align: left; }
.mm__perks li { display: flex; gap: 14px; }
.mm__perks h3 { font-size: 13.5px; font-weight: var(--font-weight-semibold); }
.mm__perks p { font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 2px; }
@media (max-width: 900px) {
  .mm__perks { grid-template-columns: minmax(0, 320px); }
  .mm__stage { height: 300px; }
}
</style>
