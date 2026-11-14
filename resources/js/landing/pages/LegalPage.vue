<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
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
// ---------- FAQ : accordéon, recherche, tout ouvrir / fermer, lien direct vers une question ----------
const isFaq = computed(() => d.value.sections.some((sec) => sec.blocks.some((b) => b.qa)));
const qid = (si, bi) => `q-${si + 1}-${bi + 1}`;
const open = reactive(new Set());
const query = ref('');
const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const plain = (x) => x.replace(/\{mail:(\w+)\}/g, (_, k) => `${emails[k]?.user ?? k}`);
const sections = computed(() => {
  const q = norm(query.value.trim());
  return d.value.sections
    .map((sec, si) => ({
      ...sec,
      blocks: sec.blocks.map((b, bi) => ({ ...b, key: qid(si, bi) })).filter((b) => !q || !b.qa || norm(`${b.qa[0]} ${plain(b.qa[1])}`).includes(q)),
    }))
    .filter((sec) => !q || sec.blocks.some((b) => b.qa));
});
const matches = computed(() => sections.value.reduce((n, sec) => n + sec.blocks.filter((b) => b.qa).length, 0));
const allKeys = computed(() => sections.value.flatMap((sec) => sec.blocks.filter((b) => b.qa).map((b) => b.key)));
const allOpen = computed(() => allKeys.value.length > 0 && allKeys.value.every((k) => open.has(k)));
function toggle(key) {
  open.has(key) ? open.delete(key) : open.add(key);
  if (open.has(key)) history.replaceState(null, '', `#${key}`);
}
function toggleAll() {
  const close = allOpen.value;
  for (const k of allKeys.value) close ? open.delete(k) : open.add(k);
}
// Ouverture fluide : la hauteur passe de 0 à la hauteur réelle du contenu.
const onEnter = (el) => { el.style.height = '0'; requestAnimationFrame(() => { el.style.height = `${el.scrollHeight}px`; }); };
const onAfterEnter = (el) => { el.style.height = ''; };
const onLeave = (el) => { el.style.height = `${el.scrollHeight}px`; requestAnimationFrame(() => { el.style.height = '0'; }); };
onMounted(async () => {
  const m = location.hash.match(/^#(q-\d+-\d+)$/);
  if (!m || !isFaq.value) return;
  open.add(m[1]);
  await nextTick();
  document.getElementById(m[1])?.scrollIntoView({ block: 'center' });
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
            <li v-for="(s, i) in sections" :key="s.id">
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
          <div v-if="isFaq" class="faq-tools">
            <div class="faq-search" role="search">
              <ZIcon name="search" :size="18" />
              <label class="sr-only" for="faq-q">{{ legal.faq.search }}</label>
              <input id="faq-q" v-model="query" type="search" autocomplete="off" :placeholder="legal.faq.search" />
            </div>
            <button type="button" class="faq-all" :aria-pressed="allOpen" @click="toggleAll">{{ allOpen ? legal.faq.closeAll : legal.faq.openAll }}</button>
            <p class="faq-count" aria-live="polite">{{ query.trim() ? t(matches === 1 ? legal.faq.one : legal.faq.many, { n: matches }) : '' }}</p>
          </div>
          <p v-if="isFaq && !matches" class="faq-none">{{ legal.faq.none }}</p>
          <section v-for="(s, i) in sections" :id="s.id" :key="s.id" class="legal__section">
            <h2><span class="num">{{ String(i + 1).padStart(2, '0') }}</span> {{ s.title }}</h2>
            <template v-for="(b, k) in s.blocks" :key="k">
              <h3 v-if="b.h">{{ b.h }}</h3>
              <p v-else-if="b.p"><template v-for="(x, n) in pieces(b.p)" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></p>
              <ul v-else-if="b.ul">
                <li v-for="item in b.ul" :key="item"><template v-for="(x, n) in pieces(item)" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></li>
              </ul>
              <div v-else-if="b.qa" :id="b.key" class="faq" :class="{ 'is-open': open.has(b.key) }">
                <h3>
                  <button type="button" :aria-expanded="open.has(b.key)" :aria-controls="`${b.key}-a`" @click="toggle(b.key)">
                    <span>{{ b.qa[0] }}</span>
                    <span class="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <Transition :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
                  <div v-if="open.has(b.key)" :id="`${b.key}-a`" class="faq__a" role="region" :aria-label="b.qa[0]">
                    <p><template v-for="(x, n) in pieces(b.qa[1])" :key="n"><ZMail v-if="x.mail" :mail="x.mail" /><template v-else>{{ x.text }}</template></template></p>
                  </div>
                </Transition>
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
.faq-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; }
.faq-search { display: flex; flex: 1 1 280px; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: var(--radius-pill); background: var(--color-bg-surface); border: 1px solid var(--color-line-strong); color: var(--color-text-muted); transition: border-color var(--motion-duration-hover); }
.faq-search:focus-within { border-color: var(--color-brand-secondary-300); }
.faq-search input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; font: inherit; font-size: 15px; color: var(--color-text-default); }
.faq-all { height: 48px; padding: 0 18px; border-radius: var(--radius-pill); border: 1px solid var(--color-line-strong); font-size: 13.5px; font-weight: var(--font-weight-medium); transition: background-color var(--motion-duration-hover), border-color var(--motion-duration-hover); }
.faq-all:hover { background: var(--fill-1); border-color: var(--color-brand-primary-300); }
.faq-count { flex-basis: 100%; min-height: 1em; font-size: 13px; color: var(--color-text-dim); }
.faq-none { margin-top: 24px; color: var(--color-text-muted); }
.faq { margin-top: 10px; border-radius: var(--radius-md); background: var(--color-bg-surface); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover), box-shadow var(--motion-duration-hover); scroll-margin-top: calc(var(--space-nav-height) + 24px); }
.faq:hover { border-color: var(--color-line-strong); }
.faq.is-open { border-color: color-mix(in srgb, var(--color-brand-primary-300) 45%, transparent); box-shadow: 0 12px 30px -20px var(--glow-brand); }
.legal__section .faq h3 { margin: 0; }
.faq button { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 16px 20px; text-align: left; font-size: 15px; font-weight: var(--font-weight-semibold); color: var(--color-text-default); }
.faq button:focus-visible { outline: 2px solid var(--color-brand-secondary-300); outline-offset: -2px; border-radius: var(--radius-md); }
.faq__icon { position: relative; flex: none; width: 14px; height: 14px; }
.faq__icon::before, .faq__icon::after { content: ''; position: absolute; left: 0; top: 6px; width: 14px; height: 2px; border-radius: 2px; background: var(--color-brand-primary-300); transition: transform var(--duration-panel) var(--motion-ease-out); }
.faq__icon::after { transform: rotate(90deg); }
.faq.is-open .faq__icon::after { transform: rotate(0deg); }
.faq__a { overflow: hidden; transition: height var(--duration-panel) var(--motion-ease-out); }
.faq__a p { margin: 0; padding: 0 20px 18px; }
@media (prefers-reduced-motion: reduce) { .faq__a { transition: none; } }
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
