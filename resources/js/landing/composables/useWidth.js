import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Largeur d'un élément, suivie avec ResizeObserver (graphiques SVG responsives). */
export function useWidth(elRef, fallback = 600) {
  const width = ref(fallback);
  let ro;
  onMounted(() => {
    ro = new ResizeObserver(([entry]) => (width.value = Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(elRef.value);
  });
  onBeforeUnmount(() => ro?.disconnect());
  return width;
}
