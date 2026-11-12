<script setup>
import { computed } from 'vue';
import LandingNav from './components/nav/LandingNav.vue';
import AppShowcase from './components/sections/AppShowcase.vue';
import CoinsMarquee from './components/sections/CoinsMarquee.vue';
import GlobeSection from './components/sections/GlobeSection.vue';
import HeroSection from './components/sections/HeroSection.vue';
import LandingFooter from './components/sections/LandingFooter.vue';
import MobileMoneySection from './components/sections/MobileMoneySection.vue';
import ProductGrid from './components/sections/ProductGrid.vue';
import SecuritySection from './components/sections/SecuritySection.vue';
import SkyBanner from './components/sections/SkyBanner.vue';
import StepsSection from './components/sections/StepsSection.vue';

// La page est une liste ordonnée de sections (content/*.js).
// Pour un nouveau type de section : créez le composant et enregistrez-le ici.
const registry = {
  hero: HeroSection,
  coins: CoinsMarquee,
  app: AppShowcase,
  sky: SkyBanner,
  products: ProductGrid,
  mobileMoney: MobileMoneySection,
  security: SecuritySection,
  steps: StepsSection,
  globe: GlobeSection,
  footer: LandingFooter,
};

const props = defineProps({ content: { type: Object, required: true } });

const known = computed(() => props.content.sections.filter((s) => registry[s.type]));
const body = computed(() => known.value.filter((s) => s.type !== 'footer'));
const footers = computed(() => known.value.filter((s) => s.type === 'footer'));
</script>

<template>
  <!-- Dégradés SVG partagés, alimentés par les tokens. -->
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="z-grad-brand" x1="0" y1="0.4" x2="1" y2="0.6">
        <stop offset="0" style="stop-color: var(--color-brand-primary)" />
        <stop offset="1" style="stop-color: var(--color-brand-secondary)" />
      </linearGradient>
      <linearGradient id="z-grad-soft" x1="0" y1="0.4" x2="1" y2="0.6">
        <stop offset="0" style="stop-color: var(--color-brand-primary-300)" />
        <stop offset="1" style="stop-color: var(--color-brand-secondary-300)" />
      </linearGradient>
      <linearGradient id="z-grad-surface" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style="stop-color: var(--color-bg-surface-2)" />
        <stop offset="1" style="stop-color: var(--color-bg-base)" />
      </linearGradient>
    </defs>
  </svg>

  <LandingNav :data="content.nav" :common="content.common" />
  <main>
    <component :is="registry[s.type]" v-for="s in body" :key="s.id" :data="s" :common="content.common" />
  </main>
  <component :is="registry[s.type]" v-for="s in footers" :key="s.id" :data="s" :common="content.common" />
</template>

<style scoped>
.defs { position: absolute; }
</style>
