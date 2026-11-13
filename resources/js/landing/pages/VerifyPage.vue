<script setup>
import { computed } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import VerifyCard from '../components/verify/VerifyCard.vue';
import VerifySeal from '../components/verify/VerifySeal.vue';

// /verify — centre officiel de vérification d'identité et anti-phishing.
// Page publique : aucune session, aucune donnée enregistrée.
const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.verify);
const links = computed(() => i18n.content.common.links);
</script>

<template>
  <SiteLayout page="verify">
    <a href="#verifier" class="sr-only vf-skip">{{ data.skip }}</a>

    <section class="vf-hero">
      <div class="vf-hero__grid" aria-hidden="true" />
      <div class="container vf-hero__inner">
        <p class="vf-badge label"><ZIcon name="shield" :size="13" /> {{ data.hero.badge }}</p>
        <div class="vf-hero__seal"><VerifySeal tone="verified" icon="check" :size="128" /></div>
        <h1 v-split class="title" v-html="data.hero.title" />
        <p v-reveal class="lede">{{ data.hero.text }}</p>
      </div>
    </section>

    <div id="verifier" class="container vf-card" tabindex="-1">
      <VerifyCard :data="data" :links="links" />
    </div>

    <section class="section vf-trust" aria-labelledby="vf-trust-title">
      <div class="container">
        <h2 id="vf-trust-title" v-split class="title" v-html="data.trust.title" />
        <p v-reveal class="lede">{{ data.trust.text }}</p>
        <ul class="vf-trust__grid">
          <li v-for="c in data.trust.items" :key="c.title" v-reveal class="vf-cat z-panel">
            <span class="vf-cat__icon"><ZIcon :name="c.icon" :size="19" /></span>
            <h3>{{ c.title }}</h3>
            <p>{{ c.text }}</p>
            <dl>
              <div><dt class="sr-only">{{ data.trust.official }}</dt><ZIcon name="check" :size="13" class="is-ok" /><dd>{{ c.example }}</dd></div>
              <div><dt class="sr-only">{{ data.trust.fake }}</dt><ZIcon name="close" :size="13" class="is-ko" /><dd class="is-fake">{{ c.counter }}</dd></div>
            </dl>
          </li>
        </ul>
      </div>
    </section>

    <section class="section vf-rules" aria-labelledby="vf-rules-title">
      <div class="container vf-rules__grid">
        <div>
          <h2 id="vf-rules-title" v-split class="title" v-html="data.rules.title" />
          <p v-reveal class="vf-rules__text">{{ data.rules.text }}</p>
          <ZButton v-reveal variant="ghost" :href="links.security">{{ data.rules.cta }} <ZIcon name="arrow-right" :size="14" /></ZButton>
        </div>
        <ol class="vf-rules__list">
          <li v-for="(r, i) in data.rules.items" :key="r.title" v-reveal>
            <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div>
              <h3>{{ r.title }}</h3>
              <p>{{ r.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="container vf-report" aria-labelledby="vf-report-title">
      <div v-reveal class="vf-report__box z-panel">
        <div>
          <h2 id="vf-report-title">{{ data.report.title }}</h2>
          <p>{{ data.report.text }}</p>
        </div>
        <ZButton size="lg" :href="links.report"><ZIcon name="flag" :size="16" /> {{ data.report.cta }}</ZButton>
      </div>
    </section>
  </SiteLayout>
</template>

<style scoped>
.vf-skip:focus { position: fixed; left: 16px; top: 72px; z-index: 60; width: auto; height: auto; clip-path: none; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); }
.vf-hero { position: relative; padding: calc(var(--space-nav-height) + 64px) 0 0; text-align: center; overflow: hidden; }
.vf-hero::before { content: ''; position: absolute; left: 50%; top: -10%; width: 900px; height: 560px; transform: translateX(-50%); background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.45; pointer-events: none; }
.vf-hero__grid {
  position: absolute; inset: 0 0 auto; height: 560px; pointer-events: none; opacity: 0.5;
  background-image: linear-gradient(var(--color-line-default) 1px, transparent 1px), linear-gradient(90deg, var(--color-line-default) 1px, transparent 1px);
  background-size: 48px 48px; mask-image: radial-gradient(ellipse 60% 70% at 50% 0%, #000, transparent); -webkit-mask-image: radial-gradient(ellipse 60% 70% at 50% 0%, #000, transparent);
}
.vf-hero__inner { position: relative; display: grid; justify-items: center; }
.vf-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: var(--radius-pill); color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 18%, transparent); border: 1px solid color-mix(in srgb, var(--color-brand-primary-300) 35%, transparent); }
.vf-hero__seal { margin: 32px 0 28px; }
.vf-hero .title { max-width: 14em; }
.vf-hero .lede { margin-top: 20px; }
.vf-card { max-width: 760px; margin-top: 48px; scroll-margin-top: calc(var(--space-nav-height) + 16px); }
.vf-card:focus { outline: none; }
.vf-trust .lede { margin-top: 16px; }
.vf-trust__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 40px; }
.vf-cat { display: flex; flex-direction: column; padding: 22px; transition: border-color var(--motion-duration-hover); }
.vf-cat:hover { border-color: var(--color-line-strong); }
.vf-cat__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--radius-md); color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 20%, transparent); }
.vf-cat h3 { margin-top: 18px; font-size: 15px; font-weight: var(--font-weight-semibold); }
.vf-cat p { flex: 1; margin-top: 8px; font-size: 13px; color: var(--color-text-muted); }
.vf-cat dl { display: grid; gap: 8px; margin: 18px 0 0; padding-top: 16px; border-top: 1px solid var(--color-line-default); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.vf-cat dl div { display: flex; align-items: center; gap: 8px; min-width: 0; }
.vf-cat dd { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vf-cat .is-ok { flex: none; color: var(--color-brand-primary-300); }
.vf-cat .is-ko { flex: none; color: var(--color-state-down); }
.vf-cat .is-fake { color: var(--color-text-dim); text-decoration: line-through color-mix(in srgb, var(--color-state-down) 60%, transparent); }
.vf-rules { padding-top: 0; }
.vf-rules__grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 64px; padding-top: 64px; border-top: 1px solid var(--color-line-default); }
.vf-rules__text { margin: 18px 0 26px; font-size: 15px; color: var(--color-text-muted); max-width: 40ch; }
.vf-rules__list { border-top: 1px solid var(--color-line-default); }
.vf-rules__list li { display: flex; gap: 28px; padding: 26px 0; border-bottom: 1px solid var(--color-line-default); }
.vf-rules__list .num { font-size: 14px; color: var(--color-brand-secondary-300); }
.vf-rules__list h3 { font-size: 16px; font-weight: var(--font-weight-semibold); }
.vf-rules__list p { margin-top: 6px; font-size: 14px; color: var(--color-text-muted); }
.vf-report { padding-bottom: var(--space-section-y); }
.vf-report__box { display: flex; justify-content: space-between; align-items: center; gap: 32px; padding: 36px; background: linear-gradient(120deg, color-mix(in srgb, var(--color-brand-primary) 22%, var(--color-bg-surface)), var(--color-bg-surface) 60%); }
.vf-report__box h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.vf-report__box p { max-width: 52ch; margin-top: 8px; font-size: 14px; color: var(--color-text-muted); }
@media (max-width: 1000px) { .vf-trust__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) {
  .vf-trust__grid { grid-template-columns: 1fr; }
  .vf-rules__grid { grid-template-columns: 1fr; gap: 32px; }
  .vf-report__box { flex-direction: column; align-items: flex-start; padding: 24px; }
}
</style>
