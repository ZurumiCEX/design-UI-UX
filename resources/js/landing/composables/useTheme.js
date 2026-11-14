import { reactive } from 'vue';
import { prefersReducedMotion } from './useReducedMotion.js';

// Thème clair / sombre. Le choix est appliqué avant l'affichage par le script de partials/head.html
// (attribut data-theme sur <html>, lu ici), puis mémorisé dans localStorage.
const KEY = 'zurumi.theme';
const META = { dark: '#050507', light: '#F7F8FB' };
const state = reactive({ theme: typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' });

function apply(theme) {
  const root = document.documentElement;
  if (theme === 'light') root.dataset.theme = 'light';
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme]);
  state.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent('zurumi:theme', { detail: theme })); // les canvas relisent leurs couleurs
}

export function setTheme(theme) {
  if (theme === state.theme) return;
  // Fondu court entre les deux thèmes quand le navigateur le permet.
  if (document.startViewTransition && !prefersReducedMotion()) {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    document.startViewTransition(() => apply(theme)).finished.finally(() => root.classList.remove('theme-switching'));
  } else apply(theme);
}

export function useTheme() {
  return { theme: state, setTheme, toggle: () => setTheme(state.theme === 'light' ? 'dark' : 'light') };
}

/** Source d'image selon le thème : `image.light` en thème clair s'il existe. */
export function themedSrc(image) {
  return state.theme === 'light' && image?.light ? image.light : image?.src;
}
