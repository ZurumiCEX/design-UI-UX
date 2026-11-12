<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZIcon from '../ui/ZIcon.vue';

// Sélecteur de langue : bouton « FR » + menu des langues disponibles.
defineProps({ align: { type: String, default: 'right' } });

const { i18n, setLocale } = useI18n();
const open = ref(false);
const trigger = ref(null);
const id = `lang-${Math.random().toString(36).slice(2, 8)}`;
const labels = computed(() => i18n.content.nav.language);

function close(refocus = false) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}
function onFocusOut(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) close();
}
async function choose(code) {
  await setLocale(code);
  close(true);
}
</script>

<template>
  <div class="lang" :class="{ 'is-open': open }" @mouseleave="close()" @focusout="onFocusOut" @keydown.esc.stop="close(true)">
    <button
      ref="trigger"
      type="button"
      class="lang__trigger label"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="`${labels.choose} (${i18n.locale.toUpperCase()})`"
      @click="open = !open"
    >
      <ZIcon name="globe" :size="14" /> {{ i18n.locale.toUpperCase() }}
    </button>
    <ul :id="id" class="lang__panel" :class="`lang__panel--${align}`" :aria-label="labels.label">
      <li v-for="lang in i18n.content.common.languages" :key="lang.code">
        <button
          type="button"
          class="lang__option"
          :lang="lang.code"
          :aria-current="lang.code === i18n.locale ? 'true' : undefined"
          @click="choose(lang.code)"
        >
          <span class="lang__code label">{{ lang.code }}</span>
          {{ lang.label }}
          <ZIcon v-if="lang.code === i18n.locale" name="check" :size="14" class="lang__check" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang { position: relative; }
.lang__trigger { display: inline-flex; align-items: center; gap: 6px; height: var(--space-nav-height); color: var(--color-text-muted); white-space: nowrap; transition: color var(--motion-duration-hover); }
.lang__trigger:hover, .lang.is-open .lang__trigger { color: var(--color-text-default); }
.lang__panel {
  position: absolute; top: calc(100% - 6px); min-width: 180px; padding: 6px; z-index: 5;
  background: var(--glass); backdrop-filter: blur(18px) saturate(1.3); -webkit-backdrop-filter: blur(18px) saturate(1.3);
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); box-shadow: 0 24px 60px -20px var(--ink);
  opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98);
  transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out), visibility 0s linear var(--duration-panel);
}
.lang__panel--right { right: -10px; transform-origin: 80% 0; }
.lang__panel--left { left: -10px; transform-origin: 20% 0; }
.lang.is-open .lang__panel { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.lang__option { display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 10px; border-radius: var(--radius-sm); font-size: 13px; font-weight: var(--font-weight-medium); text-align: left; transition: background-color var(--motion-duration-hover); }
.lang__option:hover, .lang__option:focus-visible { background: var(--fill-2); }
.lang__code { display: grid; place-items: center; width: 28px; height: 22px; border-radius: 4px; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-muted); }
.lang__option[aria-current] .lang__code { color: var(--color-text-default); border-color: var(--color-brand-primary-300); }
.lang__check { margin-left: auto; color: var(--color-brand-primary-300); }
</style>
