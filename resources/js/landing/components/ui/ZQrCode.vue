<script setup>
import { computed } from 'vue';
import qrcode from 'qrcode-generator';

// Vrai QR code généré depuis `value` (lien de téléchargement), rendu en SVG.
const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, required: true }, // texte alternatif
  size: { type: Number, default: 96 },
});

const qr = computed(() => {
  const code = qrcode(0, 'M');
  code.addData(props.value);
  code.make();
  const count = code.getModuleCount();
  let d = '';
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (code.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { count, d };
});
</script>

<template>
  <span class="z-qr" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :viewBox="`0 0 ${qr.count} ${qr.count}`" role="img" :aria-label="label" shape-rendering="crispEdges">
      <path :d="qr.d" fill="currentColor" />
    </svg>
  </span>
</template>

<style scoped>
.z-qr { display: block; padding: 8px; background: var(--color-text-default); color: var(--ink); border-radius: var(--radius-md); }
.z-qr svg { width: 100%; height: 100%; }
</style>
