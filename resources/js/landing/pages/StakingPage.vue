<script setup>
import { computed } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZTag from '../components/ui/ZTag.vue';
import StakingWidget from '../components/invest/StakingWidget.vue';

// Page Staking : en-tête + widget (textes dans content/*-invest.js → pages.staking).
const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.staking);
</script>

<template>
  <SiteLayout page="staking">
    <section class="inv-hero">
      <div class="inv-hero__halo" aria-hidden="true" />
      <div class="container">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h1 v-split class="title inv-hero__title" v-html="data.title" />
        <p v-reveal class="lede inv-hero__text">{{ data.text }}</p>
      </div>
    </section>
    <div class="container inv-body">
      <StakingWidget :data="data" />
    </div>
  </SiteLayout>
</template>

<style scoped>
.inv-hero { position: relative; padding: calc(var(--space-nav-height) + 72px) 0 32px; overflow: hidden; }
.inv-hero__halo { position: absolute; right: -10%; top: -20%; width: 60%; aspect-ratio: 1; background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.3; pointer-events: none; }
.inv-hero .container { position: relative; }
.inv-hero__title { margin-top: 22px; font-size: clamp(36px, 4.6vw, 64px); }
.inv-hero__text { margin-top: 20px; max-width: 58ch; }
.inv-body { padding-bottom: var(--space-section-y); }
</style>
