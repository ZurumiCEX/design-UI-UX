<script setup>
import { useToast } from '../../composables/useToast.js';
import ZIcon from './ZIcon.vue';

const { toasts, dismiss } = useToast();
const icons = { info: 'info', success: 'check', warn: 'alert', error: 'alert' };
</script>

<template>
  <div class="toaster" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`is-${t.tone}`">
        <ZIcon :name="icons[t.tone]" :size="16" />
        <p>{{ t.text }}</p>
        <button type="button" aria-label="×" @click="dismiss(t.id)"><ZIcon name="close" :size="14" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toaster { position: fixed; right: 20px; bottom: 20px; z-index: 200; display: grid; gap: 8px; width: min(380px, calc(100vw - 40px)); }
.toast {
  --tone: var(--color-brand-secondary-300);
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 14px 14px 14px 16px;
  border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); border-left: 3px solid var(--tone);
  box-shadow: 0 20px 50px -20px var(--ink); font-size: 13px;
}
.toast.is-success { --tone: var(--color-state-up); }
.toast.is-warn { --tone: var(--color-state-warn); }
.toast.is-error { --tone: var(--color-state-down); }
.toast > :first-child { color: var(--tone); margin-top: 1px; }
.toast button { color: var(--color-text-muted); }
.toast-enter-active, .toast-leave-active { transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
