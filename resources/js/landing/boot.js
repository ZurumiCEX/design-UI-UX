import { createApp, h } from 'vue';
import '../../css/landing.css';
import { initI18n } from './composables/useI18n.js';
import { vReveal, vSplit, whenReady, vSection } from './composables/useReveal.js';

/**
 * Monte une page sur #landing.
 * Configuration optionnelle injectée par l'hôte (Blade, Nuxt, Next…) AVANT le script :
 *   window.__LANDING__ = { locale: 'fr', links: { signup: '/inscription', … }, user: null }
 */
export async function boot(Page, { page, props = {} }) {
  const config = window.__LANDING__ ?? {};
  await initI18n({ page, config }); // la langue est prête avant le premier rendu : pas de bascule visible

  createApp({ render: () => h(Page, props) })
    .directive('reveal', vReveal)
    .directive('split', vSplit)
    .directive('section', vSection)
    .mount('#landing');

  // A3 — la séquence d'ouverture démarre quand les polices sont prêtes.
  const root = document.documentElement;
  whenReady().then(() => {
    root.classList.add('ready');
    setTimeout(() => root.classList.add('settled'), 4000);
  });
}
