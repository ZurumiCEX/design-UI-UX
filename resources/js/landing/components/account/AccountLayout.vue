<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useProfile } from '../../composables/useProfile.js';
import SiteLayout from '../layout/SiteLayout.vue';
import ZIcon from '../ui/ZIcon.vue';

// Gabarit de l'espace client : menu latéral (onglets défilants sur mobile) + contenu.
const props = defineProps({
  page: { type: String, required: true }, // account | profile | security | kyc
  title: { type: String, required: true },
});
const { i18n } = useI18n();
const { demo } = useProfile();
const menu = computed(() => i18n.content.account.menu);
const links = computed(() => i18n.content.common.links);
</script>

<template>
  <SiteLayout :page="page" :footer="false" signed-in>
    <div class="acl">
      <nav class="acl__side" :aria-label="menu.label">
        <ul>
          <li v-for="item in menu.items" :key="item.key">
            <a :href="links[item.key]" :aria-current="item.page === page ? 'page' : undefined"><ZIcon :name="item.icon" :size="17" /> {{ item.label }}</a>
          </li>
        </ul>
      </nav>
      <div class="acl__main">
        <p v-if="demo" class="acl__demo"><ZIcon name="info" :size="14" /> {{ i18n.content.account.demo }}</p>
        <h1 class="acl__title">{{ title }}</h1>
        <slot />
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.acl { display: grid; grid-template-columns: 240px minmax(0, 1fr); min-height: 100svh; padding-top: var(--space-nav-height); }
.acl__side { position: sticky; top: var(--space-nav-height); align-self: start; height: calc(100svh - var(--space-nav-height)); padding: 24px 14px; border-right: 1px solid var(--color-line-default); background: var(--color-bg-surface); }
.acl__side ul { display: grid; gap: 4px; }
.acl__side a { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: var(--radius-md); font-size: 14px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); transition: background-color var(--motion-duration-hover), color var(--motion-duration-hover); }
.acl__side a:hover { background: var(--fill-1); color: var(--color-text-default); }
.acl__side a[aria-current] { color: var(--color-text-default); background: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.acl__side a[aria-current] :deep(svg) { color: var(--color-brand-primary-300); }
.acl__main { min-width: 0; padding: 36px 48px 80px; }
.acl__demo { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; font-size: 12px; color: var(--color-text-dim); }
.acl__title { font-size: clamp(26px, 2.6vw, 34px); font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; }
@media (max-width: 960px) {
  .acl { grid-template-columns: minmax(0, 1fr); }
  .acl__side { position: sticky; top: var(--space-nav-height); z-index: 10; height: auto; padding: 8px var(--space-gutter-mobile); border-right: 0; border-bottom: 1px solid var(--color-line-default); overflow-x: auto; scrollbar-width: none; }
  .acl__side ul { display: flex; gap: 4px; width: max-content; }
  .acl__side a { padding: 8px 12px; font-size: 13px; white-space: nowrap; }
  .acl__main { padding: 24px var(--space-gutter-mobile) 64px; }
}
</style>
