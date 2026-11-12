<script setup>
import { ref } from 'vue';
import ZIcon from '../ui/ZIcon.vue';
import ZQrCode from '../ui/ZQrCode.vue';
import ZStoreButton from '../ui/ZStoreButton.vue';

// Icône de téléchargement + popover en verre : QR code, « ou via », boutons stores (A10).
defineProps({
  download: { type: Object, required: true },
  stores: { type: Array, required: true },
});

const open = ref(false);
const trigger = ref(null);
const id = `nav-dl-${Math.random().toString(36).slice(2, 8)}`;

function close(refocus = false) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}
function onFocusOut(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) close();
}
</script>

<template>
  <div
    class="dl"
    :class="{ 'is-open': open }"
    @mouseenter="open = true"
    @mouseleave="close()"
    @focusout="onFocusOut"
    @keydown.esc.stop="close(true)"
  >
    <button
      ref="trigger"
      type="button"
      class="dl__trigger"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="download.label"
      @click="open = !open"
    >
      <ZIcon name="download" :size="16" />
    </button>
    <div :id="id" class="dl__panel">
      <ZQrCode :value="download.url" :label="download.qrAlt" :size="132" />
      <p class="label dl__title">{{ download.label }}</p>
      <p class="label dl__or">{{ download.or }}</p>
      <div class="dl__stores">
        <ZStoreButton v-for="store in stores" :key="store.id" :store="store" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dl { position: relative; }
.dl__trigger {
  display: grid; place-items: center; width: 32px; height: 36px; border-radius: var(--radius-sm);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-default);
  transition: background-color var(--motion-duration-hover), color var(--motion-duration-hover);
}
.dl__trigger:hover, .dl.is-open .dl__trigger { background: var(--color-text-default); color: var(--ink); }
.dl__panel {
  position: absolute; top: calc(100% + 10px); right: -60px; display: grid; justify-items: center; gap: 10px; padding: 18px;
  background: var(--glass); backdrop-filter: blur(18px) saturate(1.3); -webkit-backdrop-filter: blur(18px) saturate(1.3);
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-lg); box-shadow: 0 24px 60px -20px var(--ink);
  opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98); transform-origin: 70% 0;
  transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out), visibility 0s linear var(--duration-panel);
}
/* Pont invisible pour ne pas perdre le survol entre l'icône et le panneau. */
.dl__panel::before { content: ''; position: absolute; inset: -12px 0 auto; height: 12px; }
.dl.is-open .dl__panel { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.dl__title { margin-top: 4px; }
.dl__or { color: var(--color-text-dim); }
.dl__stores { display: flex; gap: 8px; }
@media (max-width: 900px) { .dl__panel { right: -96px; } }
</style>
