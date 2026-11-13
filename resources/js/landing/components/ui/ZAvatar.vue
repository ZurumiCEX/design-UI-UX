<script setup>
// Avatar : photo si disponible, sinon initiales sur le dégradé de marque.
defineProps({
  src: { type: String, default: '' },
  initials: { type: String, default: '' },
  size: { type: Number, default: 32 },
});
</script>

<template>
  <span class="av" :style="{ '--s': `${size}px` }" aria-hidden="true">
    <img v-if="src" :src="src" alt="" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<style scoped>
.av {
  display: inline-grid; place-items: center; flex: none; width: var(--s); height: var(--s); overflow: hidden; border-radius: 50%;
  background: var(--gradient-brand); font-size: calc(var(--s) * 0.38); font-weight: var(--font-weight-semibold); letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px var(--color-line-strong);
}
.av img { width: 100%; height: 100%; object-fit: cover; }
</style>
