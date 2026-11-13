<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZIcon from '../components/ui/ZIcon.vue';

// Documents légaux génériques (conditions, confidentialité, risques, conformité).
// Textes dans content/*-more.js → legal.docs ; à faire valider avant publication.
const props = defineProps({ doc: { type: String, required: true } });
const { i18n, t } = useI18n();
const legal = computed(() => i18n.content.legal);
const d = computed(() => legal.value.docs[props.doc]);
const others = computed(() => Object.entries(legal.value.docs).filter(([id]) => id !== props.doc));

// Sommaire : l'entrée de la section visible est mise en avant.
const current = ref('');
let io;
onMounted(() => {
  io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) current.value = visible.target.id;
    },
    { rootMargin: '-20% 0px -65% 0px' },
  );
  document.querySelectorAll('.legal__section').forEach((el) => io.observe(el));
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <SiteLayout :page="`legal-${doc}`">
    <div class="container page legal">
      <header class="legal__head">
        <p class="legal__eyebrow label">{{ legal.eyebrow }}</p>
        <h1 v-split class="title" v-html="d.title" />
        <p class="legal__updated">{{ t(legal.updated, { date: d.updated }) }}</p>
        <p class="z-notice legal__draft" role="note"><ZIcon name="info" :size="16" /> {{ legal.draft }}</p>
      </header>

      <div class="legal__grid">
        <nav class="legal__toc" :aria-label="legal.toc">
          <p class="label">{{ legal.toc }}</p>
          <ol>
            <li v-for="(s, i) in d.sections" :key="s.id">
              <a :href="`#${s.id}`" :aria-current="current === s.id ? 'true' : undefined"><span class="num">{{ String(i + 1).padStart(2, '0') }}</span> {{ s.title }}</a>
            </li>
          </ol>
          <p class="label legal__others-title">{{ legal.others }}</p>
          <ul>
            <li v-for="[id, o] in others" :key="id"><a :href="i18n.content.common.links[legal.linkKeys[id]]">{{ o.title }}</a></li>
          </ul>
        </nav>

        <article class="legal__body">
          <p class="legal__intro">{{ d.intro }}</p>
          <section v-for="(s, i) in d.sections" :id="s.id" :key="s.id" class="legal__section">
            <h2><span class="num">{{ String(i + 1).padStart(2, '0') }}</span> {{ s.title }}</h2>
            <p v-for="(p, k) in s.paras" :key="k">{{ p }}</p>
            <ul v-if="s.list">
              <li v-for="item in s.list" :key="item">{{ item }}</li>
            </ul>
          </section>
          <p class="legal__contact">{{ legal.contact }}</p>
        </article>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.legal__head { max-width: 760px; }
.legal__eyebrow { color: var(--color-brand-secondary-300); margin-bottom: 18px; }
.legal__updated { margin-top: 16px; font-size: 13px; color: var(--color-text-muted); }
.legal__draft { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; }
.legal__draft :deep(svg) { flex: none; margin-top: 2px; color: var(--color-brand-secondary-300); }
.legal__grid { display: grid; grid-template-columns: 260px minmax(0, 720px); gap: 64px; margin-top: 56px; }
.legal__toc { position: sticky; top: calc(var(--space-nav-height) + 24px); align-self: start; max-height: calc(100vh - var(--space-nav-height) - 48px); overflow-y: auto; }
.legal__toc .label { color: var(--color-text-dim); }
.legal__toc ol { display: grid; gap: 2px; margin-top: 12px; }
.legal__toc ol a { display: flex; gap: 10px; padding: 7px 10px; border-left: 1px solid var(--color-line-default); font-size: 13px; color: var(--color-text-muted); transition: color var(--motion-duration-hover), border-color var(--motion-duration-hover); }
.legal__toc ol a span { color: var(--color-text-dim); }
.legal__toc ol a:hover, .legal__toc ol a[aria-current] { color: var(--color-text-default); border-left-color: var(--color-brand-primary-300); }
.legal__others-title { margin-top: 28px; }
.legal__toc ul { display: grid; gap: 8px; margin-top: 12px; font-size: 13px; }
.legal__toc ul a { color: var(--color-brand-primary-300); }
.legal__toc ul a:hover { color: var(--color-text-default); }
.legal__intro { font-size: 17px; line-height: 1.6; color: var(--color-text-muted); }
.legal__section { padding-top: 40px; scroll-margin-top: calc(var(--space-nav-height) + 24px); }
.legal__section h2 { display: flex; gap: 12px; font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; line-height: 1.2; }
.legal__section h2 span { color: var(--color-brand-primary-300); font-size: 15px; padding-top: 5px; }
.legal__section p { margin-top: 14px; font-size: 15px; line-height: 1.7; color: var(--color-text-muted); }
.legal__section ul { display: grid; gap: 8px; margin-top: 14px; padding-left: 20px; list-style: disc; font-size: 15px; line-height: 1.6; color: var(--color-text-muted); }
.legal__contact { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--color-line-default); font-size: 14px; color: var(--color-text-muted); }
@media (max-width: 960px) {
  .legal__grid { grid-template-columns: 1fr; gap: 32px; margin-top: 36px; }
  .legal__toc { position: static; max-height: none; }
}
</style>
