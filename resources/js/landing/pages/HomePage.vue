<script setup>
import { computed } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import AppShowcase from '../components/sections/AppShowcase.vue';
import CoinsMarquee from '../components/sections/CoinsMarquee.vue';
import GlobeSection from '../components/sections/GlobeSection.vue';
import HeroSection from '../components/sections/HeroSection.vue';
import MobileMoneySection from '../components/sections/MobileMoneySection.vue';
import ProductGrid from '../components/sections/ProductGrid.vue';
import SecuritySection from '../components/sections/SecuritySection.vue';
import SkyBanner from '../components/sections/SkyBanner.vue';
import StepsSection from '../components/sections/StepsSection.vue';

// La page d'accueil est une liste ordonnée de sections (content/*.js → sections).
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
};

const { i18n } = useI18n();
const sections = computed(() => i18n.content.sections.filter((s) => registry[s.type]));
</script>

<template>
  <SiteLayout page="home">
    <!-- Chaque section (sauf le hero et la bannière à méduse) entre en fondu à chaque passage. -->
    <component :is="registry[s.type]" v-for="s in sections" :key="s.id" v-section="!['hero', 'sky'].includes(s.type)" :data="s" :common="i18n.content.common" />
  </SiteLayout>
</template>
