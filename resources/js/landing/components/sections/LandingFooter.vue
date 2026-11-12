<script setup>
import ZIcon from '../ui/ZIcon.vue';
import ZLogo from '../ui/ZLogo.vue';

defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});
</script>

<template>
  <footer :id="data.id" class="footer">
    <span class="footer__glow" aria-hidden="true" />
    <div class="container">
      <div class="footer__top">
        <div v-reveal class="footer__brand">
          <ZLogo :brand="common.brand" />
          <p class="title" v-html="data.tagline" />
        </div>
        <nav v-for="col in data.columns" :key="col.title" v-reveal :aria-label="col.title">
          <h2 class="footer__heading">{{ col.title }}</h2>
          <ul>
            <li v-for="link in col.links" :key="link.label"><a :href="link.href">{{ link.label }}</a></li>
          </ul>
        </nav>
      </div>

      <ul class="footer__socials">
        <li v-for="s in data.socials" :key="s.label"><a class="label" :href="s.href">{{ s.label }}</a></li>
      </ul>

      <div class="footer__bottom label">
        <span>{{ data.copyright }}</span>
        <a :href="data.backToTop.href">{{ data.backToTop.label }} <ZIcon name="arrow-up" :size="12" /></a>
      </div>
      <p v-if="data.disclaimer" class="footer__note">{{ data.disclaimer }}</p>
    </div>
  </footer>
</template>

<style scoped>
.footer { position: relative; padding: 64px 0 40px; background: var(--color-bg-surface); }
.footer__glow { position: absolute; inset: 0 0 auto; height: 1px; background: linear-gradient(90deg, transparent, var(--color-brand-primary-300) 35%, var(--color-brand-secondary-300) 65%, transparent); opacity: 0.6; }
.footer__top { display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 32px; }
.footer__brand .title { margin-top: 26px; font-size: var(--font-size-h3); line-height: 1.15; letter-spacing: -0.03em; max-width: 12em; }
.footer__heading { font-size: 9.5px; font-weight: var(--font-weight-semibold); letter-spacing: var(--font-tracking-label); text-transform: uppercase; color: var(--color-text-dim); margin-bottom: 16px; }
.footer nav li + li { margin-top: 6px; }
.footer nav a { display: inline-block; font-size: 13px; color: var(--color-text-muted); transition: transform var(--motion-duration-hover) var(--motion-ease-out), color var(--motion-duration-hover); }
.footer nav a:hover { color: var(--color-text-default); transform: translateX(3px); }
.footer__socials { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 56px 0 28px; }
.footer__socials a { display: grid; place-items: center; height: 40px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); transition: transform var(--motion-duration-hover) var(--motion-ease-out), background-color var(--motion-duration-hover); }
.footer__socials a:hover { transform: translateY(-2px); background: var(--fill-2); }
.footer__bottom { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; color: var(--color-text-muted); }
.footer__bottom a { display: inline-flex; align-items: center; gap: 6px; transition: color var(--motion-duration-hover); }
.footer__bottom a:hover { color: var(--color-text-default); }
.footer__note { margin-top: 24px; max-width: 78ch; font-size: 11px; color: var(--color-text-muted); }
@media (max-width: 900px) {
  .footer__top { grid-template-columns: 1fr 1fr; }
  .footer__brand { grid-column: 1 / -1; }
  .footer__socials { grid-template-columns: 1fr 1fr; }
}
</style>
