<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useNotifications } from '../../composables/useNotifications.js';
import ZIcon from '../ui/ZIcon.vue';

// Cloche de notifications : pastille du nombre de non-lues, panneau avec onglets Toutes / Non lues.
const props = defineProps({ data: { type: Object, required: true } }); // content.notifications
const { fmt, t } = useI18n();
const { items, unread, markRead, markAll } = useNotifications();
const open = ref(false);
const tab = ref('all');
const trigger = ref(null);
const id = `ntf-${Math.random().toString(36).slice(2, 8)}`;
const list = computed(() => (tab.value === 'unread' ? items.value.filter((n) => !n.read) : items.value));
const icons = { security: 'shield', transaction: 'transfer', announcement: 'bell', kyc: 'id', p2p: 'user' };

// Sur mobile, le panneau occupe la largeur de l'écran : sa position est calculée depuis la cloche
// (un parent animé par transform empêcherait position: fixed de se caler sur l'écran).
const root = ref(null);
const panelStyle = ref(null);
function toggle() {
  open.value = !open.value;
  if (!open.value || window.innerWidth > 600) return void (panelStyle.value = null);
  const r = root.value.getBoundingClientRect();
  panelStyle.value = { right: `${-(window.innerWidth - r.right - 12)}px`, width: `${window.innerWidth - 24}px` };
}
function close(refocus = false) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}
function onFocusOut(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) close();
}
</script>

<template>
  <div ref="root" class="ntf" :class="{ 'is-open': open }" @focusout="onFocusOut" @keydown.esc.stop="close(true)">
    <button
      ref="trigger"
      type="button"
      class="ntf__trigger"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="unread ? t(data.labelUnread, { n: unread }) : data.label"
      @click="toggle"
    >
      <ZIcon name="bell" :size="17" />
      <span v-if="unread" class="ntf__count num" aria-hidden="true">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <div :id="id" class="ntf__panel" :style="panelStyle" role="region" :aria-label="data.title">
      <header class="ntf__head">
        <h2>{{ data.title }}</h2>
        <button v-if="unread" type="button" class="ntf__all" @click="markAll">{{ data.markAll }}</button>
      </header>
      <div class="z-tabs ntf__tabs" role="tablist">
        <button type="button" role="tab" class="z-tab" :aria-selected="tab === 'all'" @click="tab = 'all'">{{ data.tabs.all }}</button>
        <button type="button" role="tab" class="z-tab" :aria-selected="tab === 'unread'" @click="tab = 'unread'">
          {{ data.tabs.unread }}<span v-if="unread" class="num"> ({{ unread }})</span>
        </button>
      </div>
      <ul class="ntf__list">
        <li v-for="n in list" :key="n.id">
          <a :href="n.href ?? '#'" class="ntf__item" :class="{ 'is-unread': !n.read }" @click="markRead(n.id)">
            <span class="ntf__icon" :class="`is-${n.type}`"><ZIcon :name="icons[n.type] ?? 'bell'" :size="15" /></span>
            <span class="ntf__text">
              <strong>{{ n.title }}</strong>
              <span>{{ n.text }}</span>
              <time>{{ fmt.ago(n.ago) }}</time>
            </span>
            <span v-if="!n.read" class="ntf__dot"><span class="sr-only">{{ data.unread }}</span></span>
          </a>
        </li>
        <li v-if="!list.length" class="ntf__empty">{{ data.empty }}</li>
      </ul>
      <footer class="ntf__foot"><a :href="data.settingsHref">{{ data.settings }}</a></footer>
    </div>
  </div>
</template>

<style scoped>
.ntf { position: relative; }
.ntf__trigger { position: relative; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: var(--color-text-muted); transition: color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.ntf__trigger:hover, .ntf.is-open .ntf__trigger { color: var(--color-text-default); background: var(--fill-2); }
.ntf__count { position: absolute; top: 2px; right: 0; min-width: 16px; height: 16px; padding: 0 4px; border-radius: var(--radius-pill); background: var(--color-state-down); color: var(--color-text-default); font-size: 9.5px; font-weight: var(--font-weight-bold); line-height: 16px; text-align: center; box-shadow: 0 0 0 2px var(--color-bg-base); }
.ntf__panel {
  position: absolute; top: calc(100% + 10px); right: -60px; z-index: 5; width: 380px; max-width: calc(100vw - 24px);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); border-radius: var(--radius-lg); box-shadow: 0 30px 70px -20px var(--ink);
  opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.98); transform-origin: 85% 0;
  transition: opacity var(--duration-panel) var(--motion-ease-out), transform var(--duration-panel) var(--motion-ease-out), visibility 0s linear var(--duration-panel);
}
.ntf.is-open .ntf__panel { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.ntf__head { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px 6px; }
.ntf__head h2 { font-size: 15px; font-weight: var(--font-weight-semibold); }
.ntf__all { font-size: 12px; color: var(--color-brand-primary-300); }
.ntf__all:hover { color: var(--color-text-default); }
.ntf__tabs { padding: 0 18px; gap: 18px; }
.ntf__tabs .z-tab { font-size: 13px; padding: 10px 0; }
.ntf__list { max-height: 380px; overflow-y: auto; padding: 6px; }
.ntf__item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; padding: 12px; border-radius: var(--radius-md); transition: background-color var(--motion-duration-hover); }
.ntf__item:hover { background: var(--fill-1); }
.ntf__icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--fill-2); color: var(--color-brand-secondary-300); }
.ntf__icon.is-security { color: var(--color-state-warn); }
.ntf__icon.is-transaction { color: var(--color-state-up); }
.ntf__icon.is-kyc { color: var(--color-brand-primary-300); }
.ntf__text { display: grid; gap: 2px; font-size: 12.5px; color: var(--color-text-muted); }
.ntf__text strong { font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-text-default); }
.ntf__item:not(.is-unread) strong { color: var(--color-text-muted); }
.ntf__text time { margin-top: 2px; font-size: 11.5px; color: var(--color-text-dim); }
.ntf__dot { width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: var(--color-brand-primary-300); }
.ntf__empty { padding: 32px 12px; text-align: center; font-size: 13px; color: var(--color-text-muted); }
.ntf__foot { padding: 12px 18px; border-top: 1px solid var(--color-line-default); font-size: 12.5px; }
.ntf__foot a { color: var(--color-brand-primary-300); }
@media (max-width: 600px) { .ntf__panel { right: 0; width: 300px; max-width: none; } }
</style>
