<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { toast } from '../composables/useToast.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZLogo from '../components/ui/ZLogo.vue';
import ZTag from '../components/ui/ZTag.vue';

const { i18n, fmt } = useI18n();
const data = computed(() => i18n.content.pages.press);
const open = ref(null);

// Kit média : couleurs lues dans les tokens (jamais recopiées en dur).
const swatches = ['--color-brand-primary', '--color-brand-secondary', '--color-brand-primary-300', '--color-brand-secondary-300', '--color-bg-base'];
const hex = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toUpperCase();
async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* presse-papiers indisponible */
  }
  toast(`${value} — ${data.value.kit.copied}`, { tone: 'success' });
}
// Logo SUBSTITUT : à remplacer par les fichiers officiels.
function downloadLogo(dark) {
  const bg = dark ? hex('--color-bg-base') : '#FFFFFF';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24"><rect width="24" height="24" fill="${bg}"/><defs><linearGradient id="g" x1="0" y1=".4" x2="1" y2=".6"><stop offset="0" stop-color="${hex('--color-brand-primary')}"/><stop offset="1" stop-color="${hex('--color-brand-secondary')}"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="4.5" fill="url(#g)"/><path d="M9 9h6l-6 6h6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.download = `zurumi-logo-${dark ? 'sombre' : 'clair'}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const date = (iso) => fmt.date(new Date(iso), { dateStyle: 'long' });
</script>

<template>
  <SiteLayout page="press">
    <section class="pr-hero">
      <div class="container">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h1 v-split class="title title--display pr-hero__title" v-html="data.title" />
        <p v-reveal class="lede pr-hero__text">{{ data.text }}</p>
      </div>
    </section>

    <div class="container pr-grid">
      <section aria-labelledby="pr-releases">
        <h2 id="pr-releases" class="pr-h">{{ data.releases.title }}</h2>
        <ul class="pr-list">
          <li v-for="r in data.releases.items" :key="r.id" class="pr-item z-panel">
            <p class="pr-item__meta"><span class="label">{{ data.releases.kinds[r.kind] }}</span> <time :datetime="r.date">{{ date(r.date) }}</time></p>
            <h3>{{ r.title }}</h3>
            <p class="pr-item__sum">{{ r.summary }}</p>
            <div v-if="open === r.id" :id="`pr-${r.id}`" class="pr-item__body">
              <p v-for="p in r.body" :key="p">{{ p }}</p>
            </div>
            <button type="button" class="pr-item__more" :aria-expanded="open === r.id" :aria-controls="`pr-${r.id}`" @click="open = open === r.id ? null : r.id">
              {{ open === r.id ? data.releases.less : data.releases.more }} <ZIcon name="chevron" :size="14" />
            </button>
          </li>
        </ul>
      </section>

      <aside class="pr-side">
        <section class="pr-card z-panel" aria-labelledby="pr-contact">
          <h2 id="pr-contact">{{ data.contact.title }}</h2>
          <p>{{ data.contact.text }}</p>
          <a class="pr-mail" :href="`mailto:${data.contact.email}`"><ZIcon name="mail" :size="16" /> {{ data.contact.email }}</a>
          <p class="pr-note">{{ data.contact.note }}</p>
        </section>

        <section class="pr-card z-panel" aria-labelledby="pr-facts">
          <h2 id="pr-facts">{{ data.facts.title }}</h2>
          <dl class="pr-facts">
            <div v-for="f in data.facts.items" :key="f.label"><dt>{{ f.label }}</dt><dd>{{ f.value }}</dd></div>
          </dl>
        </section>
      </aside>
    </div>

    <section class="section pr-kit" aria-labelledby="pr-kit">
      <div class="container">
        <h2 id="pr-kit" v-split class="title" v-html="data.kit.title" />
        <p v-reveal class="lede pr-kit__text">{{ data.kit.text }}</p>
        <div class="pr-kit__grid">
          <div class="pr-logo is-dark">
            <ZLogo :brand="i18n.content.common.brand" :size="36" />
            <ZButton variant="ghost" @click="downloadLogo(true)"><ZIcon name="download" :size="14" /> {{ data.kit.dark }}</ZButton>
          </div>
          <div class="pr-logo is-light">
            <ZLogo :brand="i18n.content.common.brand" :size="36" />
            <ZButton variant="light" @click="downloadLogo(false)"><ZIcon name="download" :size="14" /> {{ data.kit.light }}</ZButton>
          </div>
        </div>
        <ul class="pr-swatches" :aria-label="data.kit.colors">
          <li v-for="s in swatches" :key="s">
            <button type="button" class="pr-swatch" @click="copy(hex(s))">
              <span :style="{ background: `var(${s})` }" />
              <strong class="num">{{ hex(s) }}</strong>
              <small>{{ data.kit.names[s] }}</small>
            </button>
          </li>
        </ul>
        <p class="pr-kit__font">{{ data.kit.font }}</p>
        <p class="pr-demo">{{ data.demo }}</p>
      </div>
    </section>
  </SiteLayout>
</template>

<style scoped>
.pr-hero { padding: calc(var(--space-nav-height) + 88px) 0 48px; }
.pr-hero__title { margin-top: 26px; max-width: 12em; }
.pr-hero__text { margin-top: 22px; max-width: 54ch; }
.pr-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; }
.pr-h { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; margin-bottom: 16px; }
.pr-list { display: grid; gap: 14px; }
.pr-item { padding: 24px; }
.pr-item__meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--color-text-muted); }
.pr-item__meta .label { padding: 3px 8px; border-radius: var(--radius-sm); color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 24%, transparent); }
.pr-item h3 { margin-top: 12px; font-size: 19px; font-weight: var(--font-weight-semibold); letter-spacing: -0.015em; }
.pr-item__sum { margin-top: 8px; font-size: 14.5px; color: var(--color-text-muted); }
.pr-item__body { display: grid; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-line-default); font-size: 14.5px; color: var(--color-text-muted); }
.pr-item__more { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-brand-primary-300); }
.pr-item__more[aria-expanded='true'] :deep(svg) { transform: rotate(180deg); }
.pr-side { position: sticky; top: calc(var(--space-nav-height) + 24px); display: grid; gap: 14px; }
.pr-card { padding: 22px; }
.pr-card h2 { font-size: 16px; font-weight: var(--font-weight-semibold); }
.pr-card > p { margin-top: 8px; font-size: 13px; color: var(--color-text-muted); }
.pr-mail { display: inline-flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 14px; font-weight: var(--font-weight-medium); color: var(--color-brand-primary-300); }
.pr-note { font-size: 12px !important; color: var(--color-text-dim) !important; }
.pr-facts { display: grid; gap: 10px; margin: 12px 0 0; font-size: 13px; }
.pr-facts div { display: flex; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--color-line-default); }
.pr-facts dt { color: var(--color-text-muted); }
.pr-facts dd { margin: 0; text-align: right; font-weight: var(--font-weight-medium); }
.pr-kit__text { margin-top: 14px; }
.pr-kit__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 32px; }
.pr-logo { display: grid; justify-items: center; gap: 24px; padding: 48px 20px 28px; border-radius: var(--radius-lg); border: 1px solid var(--color-line-default); }
.pr-logo.is-dark { background: var(--color-bg-surface); }
.pr-logo.is-light { background: var(--color-text-default); }
.pr-logo.is-light :deep(.z-logo) { color: var(--ink); }
.pr-swatches { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.pr-swatch { display: grid; gap: 4px; width: 100%; padding: 10px; border-radius: var(--radius-md); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); text-align: left; transition: border-color var(--motion-duration-hover); }
.pr-swatch:hover { border-color: var(--color-line-strong); }
.pr-swatch span { height: 56px; margin-bottom: 6px; border-radius: var(--radius-sm); border: 1px solid var(--color-line-default); }
.pr-swatch strong { font-size: 13px; }
.pr-swatch small { font-size: 12px; color: var(--color-text-muted); }
.pr-kit__font { margin-top: 18px; font-size: 13px; color: var(--color-text-muted); }
.pr-demo { margin-top: 24px; font-size: 12px; color: var(--color-text-dim); }
@media (max-width: 960px) {
  .pr-grid { grid-template-columns: 1fr; }
  .pr-side { position: static; }
  .pr-swatches { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) { .pr-kit__grid { grid-template-columns: 1fr; } }
</style>
