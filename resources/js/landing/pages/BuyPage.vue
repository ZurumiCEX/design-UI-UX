<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import BuyWidget from '../components/buy/BuyWidget.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZIconTile from '../components/ui/ZIconTile.vue';

const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.buy);
const common = computed(() => i18n.content.common);
const openFaq = ref(0);
</script>

<template>
  <SiteLayout page="buy">
    <section class="buy-hero">
      <div class="buy-hero__halo" aria-hidden="true" />
      <div class="container buy-hero__layout">
        <div class="buy-hero__copy">
          <h1 v-split class="title" v-html="data.title" />
          <p v-reveal class="lede">{{ data.text }}</p>

          <ul class="buy-hero__perks">
            <li v-for="p in data.perks" :key="p.text" v-reveal><ZIconTile :icon="p.icon" :size="26" /> {{ p.text }}</li>
          </ul>

          <div v-reveal class="buy-hero__methods">
            <p class="label">{{ data.methodsLabel }}</p>
            <ul>
              <li v-for="m in common.buy.methods" :key="m.id">
                <span class="pay-logos" aria-hidden="true"><img v-for="l in m.logos" :key="l" :src="l" alt="" width="22" height="22" /></span>
                {{ m.name ?? data.widget.card }}
              </li>
            </ul>
          </div>
        </div>

        <div v-reveal="300" class="buy-hero__widget">
          <BuyWidget :data="data.widget" :common="common" />
        </div>
      </div>
    </section>

    <section class="section buy-steps">
      <div class="container">
        <h2 v-split class="title" v-html="data.steps.title" />
        <ol class="buy-steps__list">
          <li v-for="(s, i) in data.steps.items" :key="s.title" v-reveal>
            <span class="buy-steps__num num">{{ String(i + 1).padStart(2, '0') }}</span>
            <p><strong>{{ s.title }}</strong> {{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section buy-faq">
      <div class="container buy-faq__layout">
        <h2 v-split class="title" v-html="data.faq.title" />
        <div class="buy-faq__list">
          <div v-for="(item, i) in data.faq.items" :key="item.q" v-reveal class="faq" :class="{ 'is-open': openFaq === i }">
            <h3>
              <button
                :id="`faq-q-${i}`"
                type="button"
                :aria-expanded="openFaq === i"
                :aria-controls="`faq-a-${i}`"
                @click="openFaq = openFaq === i ? -1 : i"
              >
                {{ item.q }} <ZIcon name="plus" :size="18" class="faq__icon" />
              </button>
            </h3>
            <div :id="`faq-a-${i}`" class="faq__a" role="region" :aria-labelledby="`faq-q-${i}`" :hidden="openFaq !== i">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </SiteLayout>
</template>

<style scoped>
.buy-hero { position: relative; padding: calc(var(--space-nav-height) + 72px) 0 var(--space-section-y); overflow: hidden; }
.buy-hero__halo { position: absolute; right: -10%; top: 0; width: 60%; aspect-ratio: 1; background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.35; pointer-events: none; }
.buy-hero__layout { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 420px); gap: 64px; align-items: center; }
.buy-hero__copy .lede { margin-top: 22px; }
.buy-hero__perks { display: grid; gap: 12px; margin-top: 32px; font-size: 14px; }
.buy-hero__perks li { display: flex; align-items: center; gap: 12px; }
.buy-hero__methods { margin-top: 44px; }
.buy-hero__methods .label { color: var(--color-text-dim); }
.buy-hero__methods ul { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.buy-hero__methods li { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 6px; border-radius: var(--radius-pill); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 13px; font-weight: var(--font-weight-medium); }
.pay-logos { display: inline-flex; gap: 2px; }
.pay-logos img { width: 26px; height: 26px; padding: 1px; border-radius: 7px; background: var(--color-text-default); object-fit: contain; }

.buy-steps { border-top: 1px solid var(--color-line-default); }
.buy-steps__list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin-top: 56px; }
.buy-steps__list li { padding-top: 22px; border-top: 1px solid var(--color-line-strong); }
.buy-steps__num { display: inline-block; padding: 1px 6px; border-radius: 4px; background: var(--gradient-brand); font-size: 10px; font-weight: var(--font-weight-semibold); }
.buy-steps__list p { margin-top: 16px; font-size: 14.5px; color: var(--color-text-muted); max-width: 32ch; }
.buy-steps__list strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }

.buy-faq { padding-top: 0; }
.buy-faq__layout { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 60px; }
.faq { border-bottom: 1px solid var(--color-line-default); }
.faq:first-child { border-top: 1px solid var(--color-line-default); }
.faq button { display: flex; justify-content: space-between; align-items: center; gap: 20px; width: 100%; padding: 22px 0; text-align: left; font-size: 16px; font-weight: var(--font-weight-medium); }
.faq button:hover { color: var(--color-brand-primary-300); }
.faq__icon { flex: none; color: var(--color-text-muted); transition: transform var(--duration-panel) var(--motion-ease-out); }
.faq.is-open .faq__icon { transform: rotate(45deg); color: var(--color-brand-primary-300); }
.faq__a p { padding: 0 40px 22px 0; font-size: 14.5px; color: var(--color-text-muted); }

@media (max-width: 900px) {
  .buy-hero { padding-top: calc(var(--space-nav-height) + 40px); }
  .buy-hero__layout { grid-template-columns: 1fr; gap: 40px; }
  .buy-steps__list { grid-template-columns: 1fr; gap: 28px; margin-top: 36px; }
  .buy-faq__layout { grid-template-columns: 1fr; gap: 28px; }
}
</style>
