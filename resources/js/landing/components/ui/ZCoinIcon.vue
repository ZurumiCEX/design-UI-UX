<script setup>
// Pastille d'un actif ou d'un moyen de paiement : glyphe sur sa couleur propre.
defineProps({
  glyph: { type: String, required: true },
  tone: { type: String, default: '' },
  size: { type: Number, default: 26 },
});
</script>

<template>
  <span class="z-coin-icon" :style="{ '--tone': tone || undefined, '--s': `${size}px` }" aria-hidden="true">{{ glyph }}</span>
</template>

<style scoped>
.z-coin-icon {
  display: inline-grid; place-items: center; flex: none; width: var(--s); height: var(--s); border-radius: 50%;
  background: var(--tone, var(--color-brand-primary)); color: var(--color-text-default);
  font-size: calc(var(--s) * 0.46); font-weight: var(--font-weight-semibold); line-height: 1;
  box-shadow: inset 0 1px 0 var(--color-line-strong);
}
</style>
