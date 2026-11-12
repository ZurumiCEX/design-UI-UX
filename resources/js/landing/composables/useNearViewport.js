import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Devient vrai quand l'élément approche du viewport : sert aux imports dynamiques. */
export function useNearViewport(elRef, margin = '600px') {
  const near = ref(false);
  let io;
  onMounted(() => {
    if (!('IntersectionObserver' in window)) return void (near.value = true);
    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.value = true;
        io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(elRef.value);
  });
  onBeforeUnmount(() => io?.disconnect());
  return near;
}
