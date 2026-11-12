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

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        observer.unobserve(entry.target); // révélé une fois, plus observé
      }
    },
    { threshold: 0.18 },
  );
  return observer;
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
    // Une fois révélé, on retire l'état pour ne pas retarder les transitions de survol.
    el.addEventListener('transitionend', function done(e) {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      el.removeEventListener('transitionend', done);
      el.removeAttribute('data-reveal');
    });
    observeReveal(el);
  },
  unmounted: unobserveReveal,
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
