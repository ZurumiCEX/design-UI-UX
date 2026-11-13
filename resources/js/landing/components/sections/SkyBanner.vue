<script setup>
import { ref } from 'vue';
import { useScrollProgress } from '../../composables/useScrollProgress.js';
import ZQrCode from '../ui/ZQrCode.vue';
import ZStoreButton from '../ui/ZStoreButton.vue';
import JellyfishSwim from '../visuals/JellyfishSwim.vue';

defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});

// A13 — dégradé bleu lié au scroll via --in ; la méduse nage sous le titre.
const root = ref(null);
useScrollProgress(root);
</script>

<template>
  <section :id="data.id" ref="root" class="sky">
    <div class="sky__grad" aria-hidden="true" />
    <JellyfishSwim :media="data.jellyfish" />
    <div class="container sky__head">
      <h2 v-split class="title title--display" v-html="data.title" />
    </div>
    <div v-reveal class="sky__download">
      <ZQrCode :value="common.download.url" :label="common.download.qrAlt" :size="96" />
      <p class="label">{{ common.download.label }}</p>
      <div class="sky__stores">
        <ZStoreButton v-for="store in common.stores" :key="store.id" :store="store" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.sky { position: relative; min-height: max(100svh, 860px); overflow: hidden; background: var(--color-bg-base); border-bottom: 1px solid var(--color-line-default); }
.sky__grad { position: absolute; inset: 0; opacity: var(--in, 1); background: linear-gradient(var(--color-sky-top), var(--color-sky-mid) 45%, var(--color-brand-secondary) 80%, var(--color-sky-bottom)); }
.sky__head { position: relative; z-index: 1; padding-top: 110px; text-align: center; }
.sky__head :deep(i) { color: var(--color-text-muted); }
.sky__download { position: absolute; z-index: 2; left: 50%; bottom: 56px; width: 280px; margin-left: -140px; display: grid; justify-items: center; gap: 12px; }
.sky__stores { display: flex; gap: 8px; }
@media (max-width: 900px) {
  .sky { min-height: 680px; }
  .sky__head { padding-top: 88px; }
  .sky__head .title { font-size: clamp(34px, 9.4vw, 56px); }
  /* sur mobile, le QR code n'a pas d'usage : seuls les boutons stores restent */
  .sky__download :deep(.z-qr) { display: none; }
}
</style>
