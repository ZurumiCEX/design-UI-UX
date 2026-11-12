<script setup>
import { ref } from 'vue';
import ZIcon from '../ui/ZIcon.vue';
import ZIconTile from '../ui/ZIconTile.vue';

// Menu déroulant accessible (A9) : survol, focus, clic, fermeture par Échap.
defineProps({ item: { type: Object, required: true } });

const open = ref(false);
const hovered = ref(-1);
const trigger = ref(null);
const id = `nav-dd-${Math.random().toString(36).slice(2, 8)}`;

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
    class="dd"
    :class="{ 'is-open': open }"
    @mouseenter="open = true"
    @mouseleave="close()"
    @focusout="onFocusOut"
    @keydown.esc.stop="close(true)"
  >
    <button
      ref="trigger"
      type="button"
      class="dd__trigger label"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="id"
      @click="open = !open"
    >
      {{ item.label }}
      <ZIcon name="chevron" :size="12" class="dd__chevron" />
    </button>
    <ul :id="id" class="dd__panel">
      <li v-for="(child, i) in item.children" :key="child.label">
        <a
          class="dd__link"
          :href="child.href"
          @mouseenter="hovered = i"
          @mouseleave="hovered = -1"
          @focus="hovered = i"
          @blur="hovered = -1"
        >
          <ZIconTile :icon="child.icon" :active="hovered === i" />
          {{ child.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dd { position: relative; }
.dd__trigger { display: inline-flex; align-items: center; gap: 6px; height: var(--space-nav-height); color: var(--color-text-muted); transition: color var(--motion-duration-hover); }
.dd__trigger:hover, .dd.is-open .dd__trigger { color: var(--color-text-default); }
.dd__chevron { transition: transform var(--duration-panel) var(--motion-ease-out); }
.dd.is-open .dd__chevron { transform: rotate(180deg); }
.dd__panel {
  position: absolute; top: calc(100% - 6px); left: -14px; min-width: 220px; padding: 8px;
  background: var(--glass); backdrop-filter: blur(18px) saturate(1.3); -webkit-backdrop-filter: blur(18px) saturate(1.3);
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-md);
  box-shadow: 0 24px 60px -20px var(--ink);
  opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98); transform-origin: 20% 0;
  transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out), visibility 0s linear var(--duration-panel);
}
.dd.is-open .dd__panel { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.dd__link { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 13px; font-weight: var(--font-weight-medium); transition: background-color var(--motion-duration-hover); }
.dd__link:hover, .dd__link:focus-visible { background: var(--fill-2); }
</style>
