import { onBeforeUnmount, onMounted, ref } from 'vue';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Lecture ponctuelle, utilisable hors composant. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

/** Ref réactive qui suit la préférence système. */
export function useReducedMotion() {
  const reduced = ref(prefersReducedMotion());
  let mq;
  const sync = (e) => (reduced.value = e.matches);
  onMounted(() => {
    mq = window.matchMedia(QUERY);
    reduced.value = mq.matches;
    mq.addEventListener('change', sync);
  });
  onBeforeUnmount(() => mq?.removeEventListener('change', sync));
  return reduced;
}
