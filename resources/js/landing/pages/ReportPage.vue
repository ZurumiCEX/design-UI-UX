<script setup>
import { computed } from 'vue';
import { securityEmail } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ReportForm from '../components/report/ReportForm.vue';
import ZIcon from '../components/ui/ZIcon.vue';

// Signaler une arnaque ou un abus. Jeton CSRF fourni par l'hôte : window.__LANDING__.csrf.
const { i18n, parts } = useI18n();
const data = computed(() => i18n.content.pages.report);
const links = computed(() => i18n.content.common.links);
const csrf = window.__LANDING__?.csrf ?? '';
</script>

<template>
  <SiteLayout page="report">
    <div class="container page rp">
      <header class="rp__head">
        <p class="rp__eyebrow label">{{ data.eyebrow }}</p>
        <h1 v-split class="title" v-html="data.title" />
        <p v-reveal class="lede">{{ data.text }}</p>
        <ul v-reveal class="rp__assurances">
          <li v-for="a in data.assurances" :key="a"><ZIcon name="check" :size="14" /> {{ a }}</li>
        </ul>
      </header>

      <div class="rp__grid">
        <ReportForm :data="data.form" :endpoint="links.reportAction" :csrf-token="csrf" :support-mail="securityEmail" />

        <aside class="rp__aside">
          <section class="rp__note z-panel">
            <h2>{{ data.never.title }}</h2>
            <ul>
              <li v-for="item in data.never.items" :key="item">{{ item }}</li>
            </ul>
          </section>
          <section class="rp__note rp__note--urgent z-panel">
            <h2><ZIcon name="alert" :size="18" /> {{ data.urgent.title }}</h2>
            <p>
              <template v-for="(p, i) in parts(data.urgent.text)" :key="i">
                <a v-if="p.slot === 'mail'" :href="`mailto:${securityEmail}`">{{ securityEmail }}</a>
                <template v-else>{{ p.text }}</template>
              </template>
            </p>
          </section>
          <section class="rp__note z-panel">
            <h2>{{ data.next.title }}</h2>
            <p>{{ data.next.text }}</p>
          </section>
          <a class="rp__verify z-panel" :href="links.verify">
            <ZIcon name="shield" :size="20" />
            <span><strong>{{ data.verify.title }}</strong>{{ data.verify.text }}</span>
            <ZIcon name="arrow-right" :size="16" />
          </a>
        </aside>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.rp { position: relative; }
.rp__grid > * { min-width: 0; }
.rp::before {
  content: ''; position: absolute; inset: -10% 0 auto; height: 520px; z-index: -1; pointer-events: none; filter: blur(20px);
  background: radial-gradient(50% 60% at 20% 0%, color-mix(in srgb, var(--color-brand-primary) 50%, transparent), transparent 70%),
    radial-gradient(42% 52% at 80% 8%, color-mix(in srgb, var(--color-brand-secondary) 30%, transparent), transparent 70%);
}
.rp__head { max-width: 720px; }
.rp__eyebrow { color: var(--color-brand-secondary-300); margin-bottom: 18px; }
.rp__head .lede { margin-top: 20px; max-width: 56ch; }
.rp__assurances { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
.rp__assurances li { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--radius-pill); border: 1px solid var(--color-line-default); background: var(--fill-1); font-size: 13px; color: var(--color-text-muted); }
.rp__assurances :deep(svg) { color: var(--color-state-up); }
.rp__grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; margin-top: 48px; }
.rp__aside { position: sticky; top: calc(var(--space-nav-height) + 24px); display: grid; gap: 14px; }
.rp__note { padding: 22px; }
.rp__note h2 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.rp__note ul { display: grid; gap: 8px; margin-top: 12px; padding-left: 18px; list-style: disc; font-size: 13px; color: var(--color-text-muted); }
.rp__note p { margin-top: 10px; font-size: 13px; color: var(--color-text-muted); }
.rp__note--urgent { border-color: color-mix(in srgb, var(--color-state-down) 45%, transparent); background: color-mix(in srgb, var(--color-state-down) 8%, var(--color-bg-surface)); }
.rp__note--urgent h2 :deep(svg) { color: var(--color-state-down); }
.rp__note a { color: var(--color-text-default); text-decoration: underline; text-underline-offset: 3px; }
.rp__verify { display: flex; align-items: center; gap: 14px; padding: 18px 20px; font-size: 13px; color: var(--color-text-muted); transition: border-color var(--motion-duration-hover); }
.rp__verify:hover { border-color: var(--color-brand-primary-300); }
.rp__verify > :first-child { color: var(--color-brand-primary-300); flex: none; }
.rp__verify strong { display: block; color: var(--color-text-default); font-size: 14px; }
@media (max-width: 1000px) {
  .rp__grid { grid-template-columns: 1fr; }
  .rp__aside { position: static; }
}
</style>
