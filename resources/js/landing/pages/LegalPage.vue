<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZMail from '../components/ui/ZMail.vue';
import { emails } from '../content/data.js';

// Documents légaux officiels (CGU/CGV, confidentialité, cookies, dénonciation, FAQ).
// Sources : resources/legal/*.md → scripts/build-legal.py → content/legal-docs.js.
// Blocs : { p } paragraphe, { h } sous-titre, { ul } liste, { qa } question/réponse, { table }.
const props = defineProps({ doc: { type: String, required: true } });
const { i18n, t } = useI18n();
const legal = computed(() => i18n.content.legal);
const d = computed(() => legal.value.docs[props.doc]);
// Découpe un texte autour des adresses {mail:clé} (affichées protégées par ZMail).
const pieces = (text) => text.split(/(\{mail:\w+\})/).filter(Boolean).map((x) => {
  const m = x.match(/^\{mail:(\w+)\}$/);
  return m ? { mail: emails[m[1]] } : { text: x };
});
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
        <p v-if="d.updated" class="legal__updated">{{ t(legal.updated, { date: d.updated }) }}</p>
        <ul v-if="d.meta.length" class="legal__meta">
          <li v-for="m in d.meta" :key="m"><template v-for="(x, k) in pieces(m)" :key="k"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></li>
        </ul>
        <p v-if="legal.langNote" class="z-notice legal__note" role="note" lang="en"><ZIcon name="info" :size="16" /> {{ legal.langNote }}</p>
      </header>

      <div class="legal__grid" lang="fr">
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
          <p v-for="p in d.intro" :key="p" class="legal__intro">{{ p }}</p>
          <section v-for="(s, i) in d.sections" :id="s.id" :key="s.id" class="legal__section">
            <h2><span class="num">{{ String(i + 1).padStart(2, '0') }}</span> {{ s.title }}</h2>
            <template v-for="(b, k) in s.blocks" :key="k">
              <h3 v-if="b.h">{{ b.h }}</h3>
              <p v-else-if="b.p"><template v-for="(x, n) in pieces(b.p)" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></p>
              <ul v-else-if="b.ul">
                <li v-for="item in b.ul" :key="item"><template v-for="(x, n) in pieces(item)" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></li>
              </ul>
              <div v-else-if="b.qa" class="legal__qa">
                <h3>{{ b.qa[0] }}</h3>
                <p><template v-for="(x, n) in pieces(b.qa[1])" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></p>
              </div>
              <div v-else-if="b.table" class="legal__table" tabindex="0" role="region" :aria-label="s.title">
                <table>
                  <thead><tr><th v-for="h in b.table.head" :key="h" scope="col">{{ h }}</th></tr></thead>
                  <tbody>
                    <tr v-for="row in b.table.rows" :key="row[0]">
                      <td v-for="(c, n) in row" :key="n"><code v-if="n === 0">{{ c }}</code><template v-else>{{ c }}</template></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </section>
        </article>
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.legal__head { max-width: 760px; }
.legal__eyebrow { color: var(--color-brand-secondary-300); margin-bottom: 18px; }
.legal__updated { margin-top: 16px; font-size: 13px; color: var(--color-text-muted); }
.legal__meta { display: grid; gap: 4px; margin-top: 10px; font-size: 13px; color: var(--color-text-muted); }
.legal__meta :deep(.z-mail), .legal__section :deep(.z-mail) { color: var(--color-brand-primary-300); white-space: nowrap; }
.legal__note { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; }
.legal__note :deep(svg) { flex: none; margin-top: 2px; color: var(--color-brand-secondary-300); }
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
.legal__intro + .legal__intro { margin-top: 12px; }
.legal__section { padding-top: 40px; scroll-margin-top: calc(var(--space-nav-height) + 24px); }
.legal__section h2 { display: flex; gap: 12px; font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; line-height: 1.2; }
.legal__section h2 span { color: var(--color-brand-primary-300); font-size: 15px; padding-top: 5px; }
.legal__section p { margin-top: 14px; font-size: 15px; line-height: 1.7; color: var(--color-text-muted); }
.legal__section ul { display: grid; gap: 8px; margin-top: 14px; padding-left: 20px; list-style: disc; font-size: 15px; line-height: 1.6; color: var(--color-text-muted); }
.legal__section h3 { margin-top: 24px; font-size: 16px; font-weight: var(--font-weight-semibold); color: var(--color-text-default); }
.legal__qa { margin-top: 20px; padding: 18px 20px; border-radius: var(--radius-md); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); }
.legal__qa h3 { margin-top: 0; font-size: 15px; }
.legal__qa p { margin-top: 8px; }
.legal__table { margin-top: 18px; overflow-x: auto; border-radius: var(--radius-md); border: 1px solid var(--color-line-default); }
.legal__table table { width: 100%; min-width: 620px; border-collapse: collapse; font-size: 13px; }
.legal__table th { padding: 10px 12px; text-align: left; font-weight: var(--font-weight-semibold); color: var(--color-text-default); background: var(--color-bg-surface-2); }
.legal__table td { padding: 10px 12px; border-top: 1px solid var(--color-line-default); color: var(--color-text-muted); vertical-align: top; }
.legal__table code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: var(--color-text-default); }
.legal__contact { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--color-line-default); font-size: 14px; color: var(--color-text-muted); }
@media (max-width: 960px) {
  .legal__grid { grid-template-columns: minmax(0, 1fr); gap: 32px; margin-top: 36px; }
  .legal__toc { position: static; max-height: none; }
}
</style>
