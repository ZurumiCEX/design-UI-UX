import { prefersReducedMotion } from './useReducedMotion.js';
import { splitText } from './useSplitText.js';

// Un seul IntersectionObserver pour toute la page (A1 + A2).
let observer;
const MAX_STAGGER = 6;

// On attend les polices pour que la découpe et l'ouverture (A3) partent sur le bon rendu.
const ready =
  typeof document === 'undefined'
    ? Promise.resolve()
    : Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

export const whenReady = () => ready;

// Les éléments se révèlent en entrant à l'écran, puis se réinitialisent quand ils en sortent
// complètement : l'animation rejoue à chaque passage (titres mot à mot, blocs, sections).
function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const { target: el, isIntersecting, intersectionRatio } of entries) {
        if (isIntersecting && intersectionRatio >= 0.18) reveal(el);
        else if (!isIntersecting) reset(el);
      }
    },
    { threshold: [0, 0.18] },
  );
  return observer;
}

function reveal(el) {
  if (el.classList.contains('in')) return;
  el.classList.add('in');
  if (!el._revealBlock) return;
  // Une fois révélé, on retire l'état pour ne pas retarder les transitions de survol.
  el.addEventListener('transitionend', function done(e) {
    if (e.target !== el || e.propertyName !== 'opacity') return;
    el.removeEventListener('transitionend', done);
    if (el.classList.contains('in')) el.removeAttribute('data-reveal');
  });
}

function reset(el) {
  if (!el.classList.contains('in')) return;
  el.classList.remove('in');
  el.setAttribute('data-replay', ''); // les passages suivants rejouent sans flou (plus léger à peindre)
  if (el._revealBlock) el.setAttribute('data-reveal', '');
}

export function observeReveal(el) {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    el.classList.add('in');
    return;
  }
  ready.then(() => getObserver().observe(el));
}

export function unobserveReveal(el) {
  observer?.unobserve(el);
}

/** v-reveal — bloc (A2). Valeur optionnelle : délai en ms (sinon décalage entre frères). */
export const vReveal = {
  mounted(el, { value }) {
    if (typeof value === 'number') {
      el.style.setProperty('--delay', `${value}ms`);
    } else {
      let i = 0;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.hasAttribute('data-reveal')) i++;
      el.style.setProperty('--i', Math.min(i, MAX_STAGGER));
    }
    el.setAttribute('data-reveal', '');
    el._revealBlock = true;
    observeReveal(el);
  },
  unmounted: unobserveReveal,
};

// Sections de la page d'accueil : apparition en fondu + légère montée à chaque entrée.
let sectionObserver;
/** v-section — transition d'une section entière. */
export const vSection = {
  mounted(el, { value }) {
    if (value === false) return; // section exclue (hero, bannière avec sa propre animation)
    el.setAttribute('data-section', '');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return void el.classList.add('sec-in');
    sectionObserver ??= new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, intersectionRatio } of entries) {
          if (isIntersecting && intersectionRatio >= 0.06) target.classList.add('sec-in');
          else if (!isIntersecting) target.classList.remove('sec-in');
        }
      },
      { threshold: [0, 0.06] },
    );
    sectionObserver.observe(el);
  },
  unmounted(el) {
    sectionObserver?.unobserve(el);
  },
};

/** v-split — titre mot à mot (A1). Valeur optionnelle : délai en ms. */
export const vSplit = {
  mounted(el, { value }) {
    if (typeof value === 'number') el.style.setProperty('--delay', `${value}ms`);
    splitText(el);
    el.setAttribute('data-split', '');
    observeReveal(el);
  },
  updated(el) {
    splitText(el); // le contenu a changé (langue) : on redécoupe
  },
  unmounted: unobserveReveal,
};

export function useReveal() {
  return { observeReveal, unobserveReveal, whenReady };
}
