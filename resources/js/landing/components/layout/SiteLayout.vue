<script setup>
import { useI18n } from '../../composables/useI18n.js';
import LandingNav from '../nav/LandingNav.vue';
import LandingFooter from '../sections/LandingFooter.vue';
import SvgDefs from './SvgDefs.vue';
import ZToaster from '../ui/ZToaster.vue';

// Gabarit commun : dégradés SVG partagés, navigation, contenu de la page, pied de page.
defineProps({
  page: { type: String, required: true }, // marque l'entrée de menu active
  footer: { type: Boolean, default: true },
  solidNav: { type: Boolean, default: false }, // barre opaque (pages applicatives)
  signedIn: { type: Boolean, default: false }, // pages de l'espace client : barre « connecté »
});
const { i18n } = useI18n();
</script>

<template>
  <SvgDefs />
  <span id="top" class="site-top" />

  <LandingNav :data="i18n.content.nav" :common="i18n.content.common" :page="page" :solid="solidNav" :signed-in="signedIn" :notifications="i18n.content.notifications" />
  <main>
    <slot />
  </main>
  <ZToaster />
  <LandingFooter v-if="footer" :data="i18n.content.footer" :common="i18n.content.common" />
</template>

<style scoped>
.site-top { position: absolute; top: 0; }
</style>
