import { createApp, h, shallowRef } from 'vue';
import '../../css/landing.css';
import LandingPage from './LandingPage.vue';
import { vReveal, vSplit, whenReady } from './composables/useReveal.js';
import { createDefaultContent, loadContent } from './content/index.js';

// Configuration optionnelle injectée par l'hôte (Blade, Nuxt, Next…) AVANT ce script :
//   window.__LANDING__ = { locale: 'fr', links: { signup: '/inscription', … } }
const config = window.__LANDING__ ?? {};
const locale = config.locale ?? document.documentElement.lang ?? 'fr';
const root = document.documentElement;

const content = shallowRef(createDefaultContent(config.links));
if (locale !== 'fr') loadContent(locale, config.links).then((c) => (content.value = c));

// Monte l'app sur #landing : le HTML rendu côté serveur est remplacé à l'hydratation.
createApp({ render: () => h(LandingPage, { content: content.value }) })
  .directive('reveal', vReveal)
  .directive('split', vSplit)
  .mount('#landing');

// A3 — la séquence d'ouverture démarre quand les polices sont prêtes.
whenReady().then(() => {
  root.classList.add('ready');
  setTimeout(() => root.classList.add('settled'), 4000);
});
