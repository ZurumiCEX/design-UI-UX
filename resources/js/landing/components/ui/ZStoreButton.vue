<script setup>
import ZIcon from './ZIcon.vue';

defineProps({
  store: { type: Object, required: true }, // { id: 'apple' | 'google', label, href }
  variant: { type: String, default: 'dark' }, // dark | light
});
</script>

<template>
  <a class="z-store label" :class="`z-store--${variant}`" :href="store.href">
    <ZIcon :name="store.id" :size="14" />
    {{ store.label }}
  </a>
</template>

<style scoped>
.z-store {
  display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 16px; border-radius: var(--radius-sm);
  white-space: nowrap; border: 1px solid var(--color-line-strong);
  transition: transform var(--motion-duration-hover) var(--motion-ease-out), background-color var(--motion-duration-hover);
}
.z-store:hover { transform: translateY(-1px); }
.z-store--dark { background: var(--color-bg-surface-2); color: var(--color-text-default); }
.z-store--light { background: var(--color-text-default); color: var(--ink); border-color: transparent; }
</style>
