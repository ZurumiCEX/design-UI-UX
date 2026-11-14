<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZIconTile from '../components/ui/ZIconTile.vue';

// Centre d'aide pour débutants. Navigation par ancre (#/article/…, #/categorie/…) :
// pas de rechargement, le bouton « Précédent » du navigateur fonctionne.
const { i18n, t } = useI18n();
const data = computed(() => i18n.content.pages.help);
const links = computed(() => i18n.content.common.links);

// ---------- Routage par ancre ----------
const route = ref(parseHash());
function parseHash() {
  const [, kind, id] = window.location.hash.match(/^#\/(article|categorie)\/([\w-]+)/) ?? [];
  return kind ? { kind, id } : { kind: 'home' };
}
const heading = ref(null);
async function onHash() {
  route.value = parseHash();
  query.value = '';
  await nextTick();
  if (route.value.kind !== 'home') {
    window.scrollTo({ top: 0 });
    heading.value?.focus();
  }
}
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));

const articleHref = (id) => `#/article/${id}`;
const categoryHref = (id) => `#/categorie/${id}`;
const article = computed(() => (route.value.kind === 'article' ? data.value.articles.find((a) => a.id === route.value.id) : null));
const category = computed(() => {
  const id = route.value.kind === 'categorie' ? route.value.id : article.value?.cat;
  return data.value.categories.find((c) => c.id === id) ?? null;
});
const inCategory = (id) => data.value.articles.filter((a) => a.cat === id);
const popular = computed(() => data.value.articles.filter((a) => a.popular));
const byId = (id) => data.value.articles.find((a) => a.id === id);

// ---------- Recherche instantanée (sans accents, sur titres, résumés et étapes) ----------
const query = ref('');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const results = computed(() => {
  const words = norm(query.value).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  return data.value.articles
    .map((a) => {
      const title = norm(a.title);
      const body = norm([a.summary, a.intro, ...a.steps.map((s) => `${s.title} ${s.text}`), a.tip ?? '', a.warning ?? ''].join(' '));
      const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0), 0);
      return { a, score, all: words.every((w) => title.includes(w) || body.includes(w)) };
    })
    .filter((r) => r.all)
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
});
const glossaryMatches = computed(() => {
  const q = norm(query.value.trim());
  return q.length > 1 ? data.value.glossary.filter((g) => norm(g.term).includes(q)) : [];
});
function onSearchEnter() {
  if (results.value[0]) window.location.hash = articleHref(results.value[0].id);
}
// Met en évidence les mots recherchés dans un titre (texte échappé par Vue : on découpe, on n'injecte pas de HTML).
function pieces(text) {
  const words = norm(query.value).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [{ text }];
  const n = norm(text);
  const marks = new Array(text.length).fill(false);
  for (const w of words) for (let i = n.indexOf(w); i !== -1; i = n.indexOf(w, i + 1)) for (let k = i; k < i + w.length; k++) marks[k] = true;
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === marks[i]) last.text += text[i];
    else out.push({ text: text[i], hit: marks[i] });
  }
  return out;
}

// ---------- Glossaire et avis ----------
const openTerm = ref(null);
const votes = reactive({});
function vote(id, useful) {
  votes[id] = useful ? 'yes' : 'no';
}
</script>

<template>
  <SiteLayout page="help">
    <section class="hp-hero" :class="{ 'is-compact': route.kind !== 'home' }">
      <div class="container">
        <nav v-if="route.kind !== 'home'" class="hp-crumbs" :aria-label="data.crumbs">
          <a href="#">{{ data.title }}</a>
          <template v-if="category"><ZIcon name="chevron-right" :size="13" /><a :href="categoryHref(category.id)">{{ category.title }}</a></template>
          <template v-if="article"><ZIcon name="chevron-right" :size="13" /><span aria-current="page">{{ article.title }}</span></template>
        </nav>
        <h1 v-if="route.kind === 'home'" class="title hp-title">{{ data.title }}</h1>
        <p v-if="route.kind === 'home'" class="hp-lead">{{ data.text }}</p>
        <div class="hp-search" role="search">
          <ZIcon name="search" :size="20" />
          <label class="sr-only" for="hp-q">{{ data.search.label }}</label>
          <input id="hp-q" v-model="query" type="search" autocomplete="off" :placeholder="data.search.placeholder" @keydown.enter.prevent="onSearchEnter" />
        </div>
        <div v-if="route.kind === 'home' && !query" class="hp-popular">
          <span>{{ data.search.popular }}</span>
          <button v-for="q in data.search.suggestions" :key="q" type="button" class="z-chip" @click="query = q">{{ q }}</button>
        </div>
      </div>
    </section>

    <div class="container hp-body">
      <!-- Résultats de recherche (toutes vues) -->
      <section v-if="query.trim()" class="hp-results" aria-labelledby="hp-res">
        <h2 id="hp-res" class="hp-h" aria-live="polite">{{ t(results.length === 1 ? data.search.one : data.search.many, { n: results.length, q: query.trim() }) }}</h2>
        <ul class="hp-list">
          <li v-for="a in results" :key="a.id">
            <a :href="articleHref(a.id)" class="hp-row">
              <span class="hp-row__title"><template v-for="(p, i) in pieces(a.title)" :key="i"><mark v-if="p.hit">{{ p.text }}</mark><template v-else>{{ p.text }}</template></template></span>
              <span class="hp-row__sum">{{ a.summary }}</span>
              <span class="hp-row__cat">{{ data.categories.find((c) => c.id === a.cat).title }}</span>
            </a>
          </li>
        </ul>
        <div v-if="glossaryMatches.length" class="hp-gloss-hit">
          <h3>{{ data.glossaryTitle }}</h3>
          <dl><div v-for="g in glossaryMatches" :key="g.term"><dt>{{ g.term }}</dt><dd>{{ g.def }}</dd></div></dl>
        </div>
        <p v-if="!results.length && !glossaryMatches.length" class="hp-none">{{ data.search.none }} <a :href="links.contact">{{ data.contactCta }}</a></p>
      </section>

      <!-- Accueil -->
      <template v-else-if="route.kind === 'home'">
        <section class="hp-start z-panel" aria-labelledby="hp-start">
          <h2 id="hp-start">{{ data.start.title }}</h2>
          <p>{{ data.start.text }}</p>
          <ol class="hp-start__list">
            <li v-for="(s, i) in data.start.steps" :key="s.article">
              <a :href="articleHref(s.article)">
                <span class="num">{{ i + 1 }}</span>
                <strong>{{ byId(s.article).title }}</strong>
                <small>{{ t(data.minutes, { n: byId(s.article).minutes }) }}</small>
              </a>
            </li>
          </ol>
        </section>

        <section aria-labelledby="hp-cats">
          <h2 id="hp-cats" class="hp-h">{{ data.categoriesTitle }}</h2>
          <ul class="hp-cats">
            <li v-for="c in data.categories" :key="c.id">
              <a :href="categoryHref(c.id)" class="hp-cat z-panel">
                <ZIconTile :icon="c.icon" :size="40" />
                <strong>{{ c.title }}</strong>
                <span>{{ c.text }}</span>
                <small class="num">{{ t(data.count, { n: inCategory(c.id).length }) }}</small>
              </a>
            </li>
          </ul>
        </section>

        <div class="hp-two">
          <section aria-labelledby="hp-pop">
            <h2 id="hp-pop" class="hp-h">{{ data.popularTitle }}</h2>
            <ul class="hp-list">
              <li v-for="a in popular" :key="a.id">
                <a :href="articleHref(a.id)" class="hp-row"><span class="hp-row__title">{{ a.title }}</span><span class="hp-row__sum">{{ a.summary }}</span></a>
              </li>
            </ul>
          </section>
          <section aria-labelledby="hp-gloss">
            <h2 id="hp-gloss" class="hp-h">{{ data.glossaryTitle }}</h2>
            <ul class="hp-gloss">
              <li v-for="g in data.glossary" :key="g.term">
                <button type="button" :aria-expanded="openTerm === g.term" @click="openTerm = openTerm === g.term ? null : g.term">
                  {{ g.term }} <ZIcon name="plus" :size="16" />
                </button>
                <p v-if="openTerm === g.term">{{ g.def }}</p>
              </li>
            </ul>
          </section>
        </div>
      </template>

      <!-- Catégorie -->
      <section v-else-if="route.kind === 'categorie' && category" aria-labelledby="hp-cat-title">
        <div class="hp-cat-head">
          <ZIconTile :icon="category.icon" :size="48" />
          <div>
            <h1 id="hp-cat-title" ref="heading" class="hp-page-title" tabindex="-1">{{ category.title }}</h1>
            <p>{{ category.text }}</p>
          </div>
        </div>
        <ul class="hp-list">
          <li v-for="a in inCategory(category.id)" :key="a.id">
            <a :href="articleHref(a.id)" class="hp-row"><span class="hp-row__title">{{ a.title }}</span><span class="hp-row__sum">{{ a.summary }}</span><span class="hp-row__cat num">{{ t(data.minutes, { n: a.minutes }) }}</span></a>
          </li>
        </ul>
      </section>

      <!-- Article -->
      <div v-else-if="article" class="hp-article">
        <article aria-labelledby="hp-art-title">
          <p class="hp-art-meta num">{{ category?.title }} · {{ t(data.minutes, { n: article.minutes }) }}</p>
          <h1 id="hp-art-title" ref="heading" class="hp-page-title" tabindex="-1">{{ article.title }}</h1>
          <p class="hp-art-intro">{{ article.intro }}</p>
          <ol class="hp-steps">
            <li v-for="(s, i) in article.steps" :key="s.title">
              <span class="num" aria-hidden="true">{{ i + 1 }}</span>
              <div><h2>{{ s.title }}</h2><p>{{ s.text }}</p></div>
            </li>
          </ol>
          <p v-if="article.tip" class="hp-box is-tip"><ZIcon name="info" :size="16" /> <span><strong>{{ data.tip }}</strong> {{ article.tip }}</span></p>
          <p v-if="article.warning" class="hp-box is-warn"><ZIcon name="alert" :size="16" /> <span><strong>{{ data.warning }}</strong> {{ article.warning }}</span></p>
          <ZButton v-if="article.action" :href="links[article.action.link]" class="hp-action">{{ article.action.label }} <ZIcon name="arrow-right" :size="14" /></ZButton>

          <div class="hp-vote z-panel" aria-live="polite">
            <template v-if="!votes[article.id]">
              <span>{{ data.vote.question }}</span>
              <button type="button" @click="vote(article.id, true)">{{ data.vote.yes }}</button>
              <button type="button" @click="vote(article.id, false)">{{ data.vote.no }}</button>
            </template>
            <span v-else-if="votes[article.id] === 'yes'">{{ data.vote.thanks }}</span>
            <span v-else>{{ data.vote.sorry }} <a :href="links.contact">{{ data.contactCta }}</a></span>
          </div>
        </article>
        <aside class="hp-related">
          <h2>{{ data.related }}</h2>
          <ul>
            <li v-for="id in article.related" :key="id"><a :href="articleHref(id)">{{ byId(id).title }}</a></li>
          </ul>
        </aside>
      </div>

      <section v-else class="hp-none-page">
        <h1 ref="heading" class="hp-page-title" tabindex="-1">{{ data.notFound }}</h1>
        <a href="#">{{ data.title }}</a>
      </section>

      <section class="hp-contact z-panel" aria-labelledby="hp-contact">
        <div>
          <h2 id="hp-contact">{{ data.stuck.title }}</h2>
          <p>{{ data.stuck.text }}</p>
        </div>
        <div class="hp-contact__btns">
          <ZButton :href="links.contact">{{ data.contactCta }}</ZButton>
          <ZButton variant="ghost" :href="links.report">{{ data.stuck.report }}</ZButton>
        </div>
      </section>
    </div>
  </SiteLayout>
</template>

<style scoped>
.hp-hero { padding: calc(var(--space-nav-height) + 72px) 0 56px; text-align: center; background: radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--color-brand-primary) 32%, transparent), transparent 75%); }
.hp-hero.is-compact { padding: calc(var(--space-nav-height) + 32px) 0 32px; text-align: left; }
.hp-title { font-size: clamp(34px, 4.2vw, 56px); }
.hp-lead { margin: 16px auto 0; max-width: 52ch; color: var(--color-text-muted); }
.hp-search { display: flex; align-items: center; gap: 12px; max-width: 640px; height: 60px; margin: 32px auto 0; padding: 0 20px; border-radius: var(--radius-pill); background: var(--color-bg-surface); border: 1px solid var(--color-line-strong); color: var(--color-text-muted); box-shadow: 0 30px 70px -40px var(--glow-brand); transition: border-color var(--motion-duration-hover); }
.is-compact .hp-search { margin: 18px 0 0; height: 50px; }
.hp-search:focus-within { border-color: var(--color-brand-secondary-300); }
.hp-search input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; font-size: 16px; color: var(--color-text-default); }
.hp-popular { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; margin-top: 18px; font-size: 13px; color: var(--color-text-dim); }
.hp-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-muted); }
.hp-crumbs a:hover { color: var(--color-text-default); }
.hp-crumbs [aria-current] { color: var(--color-text-default); }
.hp-body { display: grid; gap: 48px; padding-bottom: var(--space-section-y); }
.hp-h { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; margin-bottom: 16px; }
.hp-start { padding: 28px; background: linear-gradient(120deg, color-mix(in srgb, var(--color-brand-primary) 22%, var(--color-bg-surface)), var(--color-bg-surface) 60%); }
.hp-start h2 { font-size: 19px; font-weight: var(--font-weight-semibold); }
.hp-start > p { margin-top: 6px; font-size: 14px; color: var(--color-text-muted); }
.hp-start__list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.hp-start__list a { display: grid; gap: 6px; height: 100%; padding: 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); transition: border-color var(--motion-duration-hover), transform var(--motion-duration-hover) var(--motion-ease-out); }
.hp-start__list a:hover { border-color: var(--color-brand-primary-300); transform: translateY(-2px); }
.hp-start__list .num { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--gradient-brand); font-size: 12px; font-weight: var(--font-weight-semibold);  color: var(--color-on-brand); }
.hp-start__list strong { font-size: 14px; font-weight: var(--font-weight-semibold); }
.hp-start__list small { font-size: 12px; color: var(--color-text-dim); }
.hp-cats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.hp-cat { display: grid; gap: 6px; height: 100%; padding: 22px; transition: border-color var(--motion-duration-hover), transform var(--motion-duration-hover) var(--motion-ease-out); }
.hp-cat:hover { border-color: var(--color-brand-primary-300); transform: translateY(-2px); }
.hp-cat strong { margin-top: 10px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.hp-cat span { font-size: 13px; color: var(--color-text-muted); }
.hp-cat small { font-size: 12px; color: var(--color-brand-primary-300); }
.hp-two { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 40px; }
.hp-list { border-top: 1px solid var(--color-line-default); }
.hp-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; padding: 16px 6px; border-bottom: 1px solid var(--color-line-default); transition: background-color var(--motion-duration-hover); }
.hp-row:hover { background: var(--fill-1); }
.hp-row__title { font-size: 15px; font-weight: var(--font-weight-medium); }
.hp-row:hover .hp-row__title { color: var(--color-brand-primary-300); }
.hp-row__sum { grid-column: 1; font-size: 13px; color: var(--color-text-muted); }
.hp-row__cat { grid-column: 2; grid-row: 1 / 3; align-self: center; font-size: 12px; color: var(--color-text-dim); white-space: nowrap; }
mark { background: color-mix(in srgb, var(--color-brand-primary-300) 30%, transparent); color: var(--color-text-default); border-radius: 3px; }
.hp-gloss li { border-bottom: 1px solid var(--color-line-default); }
.hp-gloss li:first-child { border-top: 1px solid var(--color-line-default); }
.hp-gloss button { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 14px 4px; font-size: 14.5px; font-weight: var(--font-weight-medium); text-align: left; }
.hp-gloss button:hover { color: var(--color-brand-primary-300); }
.hp-gloss button :deep(svg) { color: var(--color-text-muted); transition: transform var(--duration-panel) var(--motion-ease-out); }
.hp-gloss button[aria-expanded='true'] :deep(svg) { transform: rotate(45deg); color: var(--color-brand-primary-300); }
.hp-gloss p { padding: 0 4px 14px; font-size: 13.5px; color: var(--color-text-muted); }
.hp-gloss-hit { margin-top: 20px; padding: 18px; border-radius: var(--radius-md); background: var(--color-bg-surface); }
.hp-gloss-hit h3 { font-size: 14px; font-weight: var(--font-weight-semibold); }
.hp-gloss-hit dl { display: grid; gap: 10px; margin: 10px 0 0; font-size: 13.5px; }
.hp-gloss-hit dt { font-weight: var(--font-weight-semibold); }
.hp-gloss-hit dd { margin: 2px 0 0; color: var(--color-text-muted); }
.hp-none { margin-top: 16px; font-size: 14px; color: var(--color-text-muted); }
.hp-none a, .hp-vote a { color: var(--color-brand-primary-300); }
.hp-cat-head { display: flex; gap: 18px; align-items: center; margin-bottom: 24px; }
.hp-cat-head p { margin-top: 4px; font-size: 14px; color: var(--color-text-muted); }
.hp-page-title { font-size: clamp(26px, 3vw, 38px); font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; line-height: 1.1; }
.hp-page-title:focus { outline: none; }
.hp-article { display: grid; grid-template-columns: minmax(0, 720px) minmax(0, 280px); gap: 56px; }
.hp-art-meta { font-size: 13px; color: var(--color-brand-primary-300); margin-bottom: 10px; }
.hp-art-intro { margin-top: 16px; font-size: 17px; line-height: 1.6; color: var(--color-text-muted); }
.hp-steps { display: grid; gap: 4px; margin-top: 28px; }
.hp-steps li { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-line-default); }
.hp-steps .num { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--gradient-brand); font-size: 13px; font-weight: var(--font-weight-semibold);  color: var(--color-on-brand); }
.hp-steps h2 { padding-top: 5px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.hp-steps p { margin-top: 4px; font-size: 14.5px; line-height: 1.6; color: var(--color-text-muted); }
.hp-box { --tone: var(--color-brand-secondary-300); display: flex; gap: 12px; margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); font-size: 14px; color: var(--color-text-muted); background: color-mix(in srgb, var(--tone) 10%, transparent); border: 1px solid color-mix(in srgb, var(--tone) 32%, transparent); }
.hp-box.is-warn { --tone: var(--color-state-warn); }
.hp-box :deep(svg) { flex: none; margin-top: 2px; color: var(--tone); }
.hp-box strong { color: var(--color-text-default); }
.hp-action { margin-top: 24px; }
.hp-vote { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 32px; padding: 16px 20px; font-size: 14px; }
.hp-vote button { padding: 6px 16px; border-radius: var(--radius-pill); border: 1px solid var(--color-line-strong); font-size: 13px; }
.hp-vote button:hover { border-color: var(--color-brand-primary-300); background: var(--fill-1); }
.hp-related { position: sticky; top: calc(var(--space-nav-height) + 24px); align-self: start; }
.hp-related h2 { font-size: 13px; font-weight: var(--font-weight-semibold); letter-spacing: var(--font-tracking-label); text-transform: uppercase; color: var(--color-text-dim); }
.hp-related ul { display: grid; gap: 10px; margin-top: 14px; }
.hp-related a { font-size: 14px; color: var(--color-text-muted); }
.hp-related a:hover { color: var(--color-brand-primary-300); }
.hp-contact { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 28px; }
.hp-contact h2 { font-size: 18px; font-weight: var(--font-weight-semibold); }
.hp-contact p { margin-top: 4px; font-size: 14px; color: var(--color-text-muted); }
.hp-contact__btns { display: flex; flex-wrap: wrap; gap: 10px; }
@media (max-width: 960px) {
  .hp-start__list { grid-template-columns: 1fr 1fr; }
  .hp-cats { grid-template-columns: 1fr 1fr; }
  .hp-two, .hp-article { grid-template-columns: 1fr; gap: 32px; }
  .hp-related { position: static; }
  .hp-contact { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 560px) { .hp-start__list, .hp-cats { grid-template-columns: 1fr; } .hp-row__cat { display: none; } }
</style>
