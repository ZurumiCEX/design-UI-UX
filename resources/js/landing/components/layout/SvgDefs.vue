<!-- Dégradés SVG partagés (logo, bouclier, crête), alimentés par les tokens. -->
<template>
<svg class="site-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="z-grad-brand" x1="0" y1="0.4" x2="1" y2="0.6">
      <stop offset="0" style="stop-color: var(--color-brand-primary)" />
      <stop offset="1" style="stop-color: var(--color-brand-secondary)" />
    </linearGradient>
    <linearGradient id="z-grad-soft" x1="0" y1="0.4" x2="1" y2="0.6">
      <stop offset="0" style="stop-color: var(--color-brand-primary-300)" />
      <stop offset="1" style="stop-color: var(--color-brand-secondary-300)" />
    </linearGradient>
    <linearGradient id="z-grad-surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color: var(--color-bg-surface-2)" />
      <stop offset="1" style="stop-color: var(--color-bg-base)" />
    </linearGradient>
  </defs>
</svg>
</template>

<style scoped>
.site-defs { position: absolute; }
</style>
