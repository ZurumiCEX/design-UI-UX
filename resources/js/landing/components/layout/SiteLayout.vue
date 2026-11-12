<script setup>
import { useI18n } from '../../composables/useI18n.js';
import LandingNav from '../nav/LandingNav.vue';
import LandingFooter from '../sections/LandingFooter.vue';
import SvgDefs from './SvgDefs.vue';

// Gabarit commun : dégradés SVG partagés, navigation, contenu de la page, pied de page.
defineProps({
  page: { type: String, required: true }, // marque l'entrée de menu active
  footer: { type: Boolean, default: true },
  solidNav: { type: Boolean, default: false }, // barre opaque (pages applicatives)
});
const { i18n } = useI18n();
</script>

<template>
  <SvgDefs />
  <span id="top" class="site-top" />

  <LandingNav :data="i18n.content.nav" :common="i18n.content.common" :page="page" :solid="solidNav" />
  <main>
    <slot />
  </main>
  <LandingFooter v-if="footer" :data="i18n.content.footer" :common="i18n.content.common" />
</template>

<style scoped>
.site-top { position: absolute; top: 0; }
</style>
