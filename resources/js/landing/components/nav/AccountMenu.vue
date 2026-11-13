<script setup>
import { ref } from 'vue';
import { useProfile } from '../../composables/useProfile.js';
import ZAvatar from '../ui/ZAvatar.vue';
import ZIcon from '../ui/ZIcon.vue';

// Menu du compte (utilisateur connecté) : identité, raccourcis de l'espace client, déconnexion.
const props = defineProps({
  data: { type: Object, required: true }, // nav.account
  links: { type: Object, required: true },
  page: { type: String, default: '' },
});
const { profile, initials } = useProfile();
const open = ref(false);
const trigger = ref(null);
const id = `acc-${Math.random().toString(36).slice(2, 8)}`;
function close(refocus = false) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}
function onFocusOut(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) close();
}
</script>

<template>
  <div class="am" :class="{ 'is-open': open }" @focusout="onFocusOut" @keydown.esc.stop="close(true)">
    <button ref="trigger" type="button" class="am__trigger" aria-haspopup="true" :aria-expanded="open" :aria-controls="id" :aria-label="data.label" @click="open = !open">
      <ZAvatar :src="profile.avatar ?? ''" :initials="initials()" :size="32" />
    </button>
    <div :id="id" class="am__panel">
      <div class="am__who">
        <ZAvatar :src="profile.avatar ?? ''" :initials="initials()" :size="40" />
        <div>
          <strong>{{ profile.firstName }} {{ profile.lastName }}</strong>
          <span class="num">UID {{ profile.uid }}</span>
        </div>
      </div>
      <ul>
        <li v-for="item in data.items" :key="item.key">
          <a :href="links[item.key]" :aria-current="item.page === page ? 'page' : undefined"><ZIcon :name="item.icon" :size="16" /> {{ item.label }}</a>
        </li>
      </ul>
      <a class="am__out" :href="links.logout"><ZIcon name="arrow-left" :size="16" /> {{ data.logout }}</a>
    </div>
  </div>
</template>

<style scoped>
.am { position: relative; }
.am__trigger { display: grid; place-items: center; border-radius: 50%; transition: box-shadow var(--motion-duration-hover); }
.am__trigger:hover, .am.is-open .am__trigger { box-shadow: 0 0 0 2px var(--color-brand-primary-300); }
.am__panel {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 5; width: 260px; padding: 8px;
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); border-radius: var(--radius-lg); box-shadow: 0 30px 70px -20px var(--ink);
  opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98); transform-origin: 90% 0;
  transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out), visibility 0s linear var(--duration-panel);
}
.am.is-open .am__panel { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.am__who { display: flex; align-items: center; gap: 12px; padding: 10px 10px 14px; border-bottom: 1px solid var(--color-line-default); margin-bottom: 6px; }
.am__who strong { display: block; font-size: 14px; font-weight: var(--font-weight-semibold); }
.am__who span { font-size: 11.5px; color: var(--color-text-muted); }
.am__panel a { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: var(--radius-sm); font-size: 13px; color: var(--color-text-muted); transition: background-color var(--motion-duration-hover), color var(--motion-duration-hover); }
.am__panel a:hover { background: var(--fill-2); color: var(--color-text-default); }
.am__panel a[aria-current] { color: var(--color-brand-primary-300); }
.am__out { margin-top: 6px; border-top: 1px solid var(--color-line-default); border-radius: 0 0 var(--radius-sm) var(--radius-sm) !important; }
</style>
