<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import ZIcon from './ZIcon.vue';

// Fenêtre modale accessible : titre, focus piégé, Échap et clic extérieur pour fermer, focus rendu à l'ouvreur.
const props = defineProps({
  title: { type: String, required: true },
  closeLabel: { type: String, default: 'Fermer' },
  size: { type: String, default: 'md' }, // md | sm
});
const emit = defineEmits(['close']);
const box = ref(null);
const uid = `dlg-${Math.random().toString(36).slice(2, 8)}`;
let opener = null;

function onKey(e) {
  if (e.key === 'Escape') return emit('close');
  if (e.key !== 'Tab') return;
  const items = [...box.value.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.offsetParent);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
onMounted(() => {
  opener = document.activeElement;
  document.body.style.overflow = 'hidden';
  nextTick(() => (box.value.querySelector('[autofocus], input, button:not(.dlg__close)') ?? box.value).focus());
});
onBeforeUnmount(() => {
  document.body.style.overflow = '';
  opener?.focus?.();
});
defineExpose({ uid: props.title });
</script>

<template>
  <Teleport to="body">
    <div class="dlg" @keydown="onKey">
      <div class="dlg__scrim" aria-hidden="true" @click="emit('close')" />
      <div ref="box" class="dlg__box" :class="`dlg__box--${size}`" role="dialog" aria-modal="true" :aria-labelledby="uid" tabindex="-1">
        <header class="dlg__head">
          <h2 :id="uid">{{ title }}</h2>
          <button type="button" class="dlg__close" :aria-label="closeLabel" @click="emit('close')"><ZIcon name="close" :size="18" /></button>
        </header>
        <div class="dlg__body"><slot /></div>
        <footer v-if="$slots.footer" class="dlg__foot"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dlg { position: fixed; inset: 0; z-index: 150; display: grid; place-items: center; padding: 20px; }
.dlg__scrim { position: absolute; inset: 0; background: color-mix(in srgb, var(--color-bg-base) 75%, transparent); backdrop-filter: blur(6px); animation: dlg-fade var(--duration-panel) var(--motion-ease-out); }
.dlg__box {
  position: relative; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; width: min(520px, 100%); max-height: calc(100dvh - 40px);
  border-radius: var(--radius-lg); background: var(--color-bg-surface); border: 1px solid var(--color-line-strong); box-shadow: 0 40px 100px -30px var(--ink);
  animation: dlg-in var(--motion-duration-reveal) var(--motion-ease-out);
}
.dlg__box--sm { width: min(420px, 100%); }
.dlg__box:focus { outline: none; }
.dlg__head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 22px; border-bottom: 1px solid var(--color-line-default); }
.dlg__head h2 { font-size: 17px; font-weight: var(--font-weight-semibold); letter-spacing: -0.01em; }
.dlg__close { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: var(--color-text-muted); }
.dlg__close:hover { background: var(--fill-2); color: var(--color-text-default); }
.dlg__body { overflow-y: auto; padding: 22px; }
.dlg__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid var(--color-line-default); }
@keyframes dlg-fade { from { opacity: 0; } }
@keyframes dlg-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
@media (prefers-reduced-motion: reduce) { .dlg__box, .dlg__scrim { animation: none; } }
</style>
