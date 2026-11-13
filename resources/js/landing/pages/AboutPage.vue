<script setup>
import { computed } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZIconTile from '../components/ui/ZIconTile.vue';
import ZTag from '../components/ui/ZTag.vue';

const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.about);
const links = computed(() => i18n.content.common.links);
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
</script>

<template>
  <SiteLayout page="about">
    <section class="ab-hero">
      <div class="ab-hero__halo" aria-hidden="true" />
      <div class="container">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h1 v-split class="title title--display ab-hero__title" v-html="data.title" />
        <p v-reveal class="lede ab-hero__text">{{ data.text }}</p>
      </div>
    </section>

    <section class="container ab-mission">
      <blockquote v-reveal class="ab-mission__quote">
        <p v-html="data.mission.quote" />
        <footer class="label">{{ data.mission.label }}</footer>
      </blockquote>
      <dl class="ab-facts">
        <div v-for="f in data.facts" :key="f.label" v-reveal>
          <dt>{{ f.label }}</dt>
          <dd class="num">{{ f.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="section ab-story" aria-labelledby="ab-story">
      <div class="container ab-story__grid">
        <div>
          <h2 id="ab-story" v-split class="title" v-html="data.story.title" />
          <p v-for="p in data.story.paras" :key="p" v-reveal class="ab-story__p">{{ p }}</p>
        </div>
        <ol class="ab-timeline">
          <li v-for="m in data.story.milestones" :key="m.when" v-reveal>
            <span class="ab-timeline__when num">{{ m.when }}</span>
            <h3>{{ m.title }}</h3>
            <p>{{ m.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section ab-values" aria-labelledby="ab-values">
      <div class="container">
        <h2 id="ab-values" v-split class="title" v-html="data.values.title" />
        <ul class="ab-values__grid">
          <li v-for="v in data.values.items" :key="v.title" v-reveal class="z-panel">
            <ZIconTile :icon="v.icon" :size="40" />
            <h3>{{ v.title }}</h3>
            <p>{{ v.text }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section ab-team" aria-labelledby="ab-team">
      <div class="container">
        <h2 id="ab-team" v-split class="title" v-html="data.team.title" />
        <p v-reveal class="lede ab-team__text">{{ data.team.text }}</p>
        <ul class="ab-team__grid">
          <li v-for="m in data.team.members" :key="m.role" v-reveal>
            <span class="ab-team__avatar" aria-hidden="true">{{ initials(m.name) }}</span>
            <strong>{{ m.name }}</strong>
            <span>{{ m.role }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="container ab-cta">
      <div v-reveal class="ab-cta__box z-panel">
        <div>
          <h2>{{ data.cta.title }}</h2>
          <p>{{ data.cta.text }}</p>
        </div>
        <div class="ab-cta__btns">
          <ZButton size="lg" :href="links.careers">{{ data.cta.careers }}</ZButton>
          <ZButton size="lg" variant="ghost" :href="links.contact">{{ data.cta.contact }} <ZIcon name="arrow-right" :size="14" /></ZButton>
        </div>
      </div>
      <p class="ab-demo">{{ data.demo }}</p>
    </section>
  </SiteLayout>
</template>

<style scoped>
.ab-hero { position: relative; padding: calc(var(--space-nav-height) + 88px) 0 64px; overflow: hidden; }
.ab-hero__halo { position: absolute; left: 50%; top: -20%; width: 70%; aspect-ratio: 1; background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.4; pointer-events: none; }
.ab-hero .container { position: relative; }
.ab-hero__title { margin-top: 26px; max-width: 13em; }
.ab-hero__text { margin-top: 24px; max-width: 52ch; }
.ab-mission { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 56px; align-items: center; padding-bottom: 40px; }
.ab-mission__quote { margin: 0; padding-left: 28px; border-left: 2px solid var(--color-brand-primary-300); }
.ab-mission__quote p { font-size: clamp(22px, 2.4vw, 32px); font-weight: var(--font-weight-medium); letter-spacing: -0.02em; line-height: 1.3; }
.ab-mission__quote :deep(b) { background: var(--gradient-brand-soft); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: inherit; }
.ab-mission__quote footer { margin-top: 18px; color: var(--color-text-dim); }
.ab-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin: 0; border-radius: var(--radius-lg); overflow: hidden; background: var(--color-line-default); }
.ab-facts div { padding: 22px; background: var(--color-bg-surface); }
.ab-facts dt { font-size: 12.5px; color: var(--color-text-muted); }
.ab-facts dd { margin: 8px 0 0; font-size: 30px; font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; }
.ab-story__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; }
.ab-story__p { margin-top: 18px; font-size: 15.5px; color: var(--color-text-muted); max-width: 52ch; }
.ab-story__grid > div > .title { margin-bottom: 10px; }
.ab-timeline { position: relative; display: grid; gap: 28px; padding-left: 28px; border-left: 1px solid var(--color-line-strong); }
.ab-timeline li { position: relative; }
.ab-timeline li::before { content: ''; position: absolute; left: -33px; top: 6px; width: 9px; height: 9px; border-radius: 50%; background: var(--gradient-brand); box-shadow: 0 0 0 4px var(--color-bg-base); }
.ab-timeline__when { font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); }
.ab-timeline h3 { margin-top: 4px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.ab-timeline p { margin-top: 4px; font-size: 14px; color: var(--color-text-muted); }
.ab-values__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 40px; }
.ab-values__grid li { padding: 24px; }
.ab-values__grid h3 { margin-top: 18px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.ab-values__grid p { margin-top: 8px; font-size: 14px; color: var(--color-text-muted); }
.ab-team__text { margin-top: 16px; }
.ab-team__grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; margin-top: 36px; }
.ab-team__grid li { display: grid; justify-items: center; gap: 4px; padding: 22px 12px; border-radius: var(--radius-lg); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); text-align: center; }
.ab-team__avatar { display: grid; place-items: center; width: 64px; height: 64px; margin-bottom: 10px; border-radius: 50%; background: var(--gradient-brand); font-size: 20px; font-weight: var(--font-weight-semibold); }
.ab-team__grid strong { font-size: 14px; font-weight: var(--font-weight-semibold); }
.ab-team__grid span:last-child { font-size: 12.5px; color: var(--color-text-muted); }
.ab-cta { padding-bottom: var(--space-section-y); }
.ab-cta__box { display: flex; justify-content: space-between; align-items: center; gap: 32px; padding: 40px; background: linear-gradient(120deg, color-mix(in srgb, var(--color-brand-primary) 26%, var(--color-bg-surface)), var(--color-bg-surface) 60%); }
.ab-cta__box h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.ab-cta__box p { margin-top: 8px; font-size: 14px; color: var(--color-text-muted); max-width: 48ch; }
.ab-cta__btns { display: flex; flex-wrap: wrap; gap: 10px; }
.ab-demo { margin-top: 20px; font-size: 12px; color: var(--color-text-dim); }
@media (max-width: 1100px) { .ab-team__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .ab-values__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 860px) {
  .ab-mission, .ab-story__grid { grid-template-columns: 1fr; gap: 36px; }
  .ab-cta__box { flex-direction: column; align-items: flex-start; padding: 26px; }
}
@media (max-width: 560px) { .ab-team__grid, .ab-values__grid { grid-template-columns: 1fr 1fr; } }
</style>
