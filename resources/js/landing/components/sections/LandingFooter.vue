<script setup>
import BackToTop from '../ui/BackToTop.vue';
import ZSocialIcon, { SOCIAL_ICONS } from '../ui/ZSocialIcon.vue';
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
          <ZLogo :brand="common.brand" variant="full" :size="54" />
          <p class="title" v-html="data.tagline" />
        </div>
        <nav v-for="col in data.columns" :key="col.title" v-reveal :aria-label="col.title">
          <h2 class="footer__heading">{{ col.title }}</h2>
          <ul>
            <li v-for="link in col.links" :key="link.label"><a :href="link.href">{{ link.label }}</a></li>
          </ul>
        </nav>
      </div>

      <div class="footer__bottom">
        <ul class="footer__socials" :aria-label="data.socialsLabel">
          <li v-for="s in data.socials" :key="s.id">
            <a :href="s.href" :aria-label="s.label" :title="s.label" :style="{ '--brand': SOCIAL_ICONS[s.id].color }" :class="{ 'is-dark': ['x', 'tiktok'].includes(s.id) }" rel="noopener">
              <ZSocialIcon :name="s.id" :size="18" />
            </a>
          </li>
        </ul>
        <span class="footer__copy label">{{ data.copyright }}</span>
        <BackToTop :label="data.backToTop.label" />
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
.footer__bottom { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--color-line-default); }
.footer__socials { display: flex; flex-wrap: wrap; gap: 10px; }
.footer__socials a {
  display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; color: var(--color-text-muted);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default);
  transition: transform var(--motion-duration-hover) var(--motion-ease-out), background-color var(--motion-duration-hover), color var(--motion-duration-hover), border-color var(--motion-duration-hover);
}
/* Au survol : la couleur de la marque. X et TikTok (noirs) gardent un contour clair. */
.footer__socials a:hover, .footer__socials a:focus-visible { transform: translateY(-2px); color: var(--color-text-default); background: var(--brand); border-color: transparent; }
.footer__socials a.is-dark:hover, .footer__socials a.is-dark:focus-visible { border-color: var(--color-line-strong); }
.footer__copy { margin-left: auto; color: var(--color-text-muted); }
.footer__note { margin-top: 24px; max-width: 78ch; font-size: 11px; color: var(--color-text-muted); }
@media (max-width: 900px) {
  .footer__top { grid-template-columns: 1fr 1fr; }
  .footer__brand { grid-column: 1 / -1; }
  .footer__copy { order: 3; width: 100%; margin-left: 0; }
}
</style>
