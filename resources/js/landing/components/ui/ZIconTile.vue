<script setup>
import ZIcon from './ZIcon.vue';

defineProps({
  icon: { type: String, required: true },
  size: { type: Number, default: 30 },
  active: { type: Boolean, default: false },
});
</script>

<template>
  <span class="z-tile" :class="{ 'is-active': active }" :style="{ width: `${size}px`, height: `${size}px` }">
    <ZIcon :name="icon" :size="Math.round(size * 0.5)" />
  </span>
</template>

<style scoped>
.z-tile {
  position: relative; display: inline-grid; place-items: center; flex: none; isolation: isolate;
  border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default);
  color: var(--color-brand-primary-300);
  transition: color var(--motion-duration-hover), box-shadow var(--motion-duration-hover);
}
/* Le dégradé est une couche en fondu : on n'anime que l'opacité. */
.z-tile::before {
  content: ''; position: absolute; inset: -1px; z-index: -1; border-radius: inherit;
  background: var(--gradient-brand); opacity: 0; transition: opacity var(--motion-duration-hover);
}
.z-tile.is-active { color: var(--color-on-brand); box-shadow: 0 6px 22px -6px var(--glow-brand); }
.z-tile.is-active::before { opacity: 1; }
</style>
