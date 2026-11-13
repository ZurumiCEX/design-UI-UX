<script setup>
import { computed, nextTick, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { useMarketFeed } from '../composables/useMarketFeed.js';
import { buyHref, tradeHref } from '../market/links.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import MarketHighlights from '../components/markets/MarketHighlights.vue';
import ZCoinIcon from '../components/ui/ZCoinIcon.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import Sparkline from '../components/visuals/Sparkline.vue';

const { i18n, fmt, t } = useI18n();
const feed = useMarketFeed();
const data = computed(() => i18n.content.pages.markets);
const common = computed(() => i18n.content.common);

// ---------- Favoris (mémorisés dans le navigateur) ----------
const FAV_KEY = 'zurumi.favorites';
const favorites = ref(new Set(readFavorites()));
function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function toggleFavorite(id) {
  const next = new Set(favorites.value);
  next.has(id) ? next.delete(id) : next.add(id);
  favorites.value = next;
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
  } catch {
    /* stockage indisponible : favoris non mémorisés */
  }
}

// ---------- Filtres, recherche, tri ----------
const tab = ref('all'); // all | favorites
const chip = ref('all'); // all | new | <catégorie>
const query = ref('');
const period = ref('24h');
const sort = ref({ key: 'rank', dir: 'asc' });

const rankOf = computed(() => {
  const ranked = [...feed.coins].sort((a, b) => b.cap - a.cap);
  return Object.fromEntries(ranked.map((c, i) => [c.id, i + 1]));
});
const chips = computed(() => [
  { id: 'all', label: data.value.chips.all },
  { id: 'new', label: data.value.chips.new },
  ...Object.entries(common.value.categories).map(([id, label]) => ({ id, label })),
]);

const sortValue = {
  rank: (c) => rankOf.value[c.id],
  name: (c) => c.name.toLowerCase(),
  price: (c) => c.price,
  change: (c) => c.change[period.value],
  cap: (c) => c.cap,
  volume: (c) => c.volume,
};

const rows = computed(() => {
  const q = query.value.trim().toLowerCase();
  const list = feed.coins.filter((c) => {
    if (tab.value === 'favorites' && !favorites.value.has(c.id)) return false;
    if (chip.value === 'new' && !c.isNew) return false;
    if (!['all', 'new'].includes(chip.value) && c.category !== chip.value) return false;
    return !q || c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });
  const get = sortValue[sort.value.key];
  const dir = sort.value.dir === 'asc' ? 1 : -1;
  return list.sort((a, b) => (get(a) > get(b) ? dir : get(a) < get(b) ? -dir : 0));
});

const columns = computed(() => [
  { key: 'rank', label: data.value.table.cols.rank, cls: 'c-rank' },
  { key: 'name', label: data.value.table.cols.name, cls: 'c-name' },
  { key: 'price', label: data.value.table.cols.price, cls: 'c-price' },
  { key: 'change', label: data.value.table.cols.change, cls: 'c-change' },
  { key: null, label: data.value.table.cols.chart, cls: 'c-chart' },
  { key: 'cap', label: data.value.table.cols.cap, cls: 'c-cap' },
  { key: 'volume', label: data.value.table.cols.volume, cls: 'c-volume' },
  { key: null, label: data.value.table.cols.action, cls: 'c-action' },
]);

function sortBy(key) {
  const numeric = !['rank', 'name'].includes(key);
  sort.value = sort.value.key === key ? { key, dir: sort.value.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: numeric ? 'desc' : 'asc' };
}
const ariaSort = (key) => (sort.value.key === key ? (sort.value.dir === 'asc' ? 'ascending' : 'descending') : undefined);

// Les titres des cartes appliquent un préréglage au tableau puis y font défiler.
const tableTop = ref(null);
async function showPreset(id) {
  tab.value = 'all';
  query.value = '';
  chip.value = id === 'newest' ? 'new' : 'all';
  sort.value = id === 'trending' ? { key: 'volume', dir: 'desc' } : id === 'gainers' ? { key: 'change', dir: 'desc' } : { key: 'rank', dir: 'asc' };
  if (id === 'gainers') period.value = '24h';
  await nextTick();
  tableTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const emptyText = computed(() =>
  tab.value === 'favorites' && !favorites.value.size ? data.value.table.empty.favorites : t(data.value.table.empty.search, { query: query.value }),
);
const flash = (c) => (c.seq ? (c.dir > 0 ? 'flash-up' : 'flash-down') : '');
</script>

<template>
  <SiteLayout page="markets">
    <div class="container page markets">
      <header class="markets__head">
        <h1 v-split class="title" v-html="data.title" />
        <p v-reveal class="lede">{{ data.text }}</p>
      </header>

      <MarketHighlights :coins="feed.coins" :data="data" :links="common.links" @show="showPreset" />

      <div ref="tableTop" class="markets__bar">
        <div class="z-tabs" role="tablist" :aria-label="data.tabs.label">
          <button type="button" role="tab" class="z-tab" :aria-selected="tab === 'favorites'" @click="tab = 'favorites'">
            {{ data.tabs.favorites }}
          </button>
          <button type="button" role="tab" class="z-tab" :aria-selected="tab === 'all'" @click="tab = 'all'">{{ data.tabs.all }}</button>
        </div>
        <label class="markets__search">
          <ZIcon name="search" :size="16" />
          <span class="sr-only">{{ data.search.label }}</span>
          <input v-model="query" type="search" :placeholder="data.search.placeholder" autocomplete="off" />
        </label>
      </div>

      <div class="markets__chips" role="group" :aria-label="data.chips.label">
        <button v-for="c in chips" :key="c.id" type="button" class="z-chip" :aria-pressed="chip === c.id" @click="chip = c.id">
          {{ c.label }}
        </button>
      </div>

      <div class="markets__table-head">
        <h2 class="markets__table-title">{{ data.table.title }}</h2>
        <p>{{ data.table.text }}</p>
      </div>

      <div class="markets__table">
        <table>
          <caption class="sr-only">{{ data.table.caption }}</caption>
          <thead>
            <tr>
              <th class="c-fav"><span class="sr-only">★</span></th>
              <th v-for="col in columns" :key="col.cls" :class="col.cls" scope="col" :aria-sort="col.key ? ariaSort(col.key) : undefined">
                <button v-if="col.key" type="button" class="th-sort" :aria-label="t(data.table.sort, { col: col.label })" @click="sortBy(col.key)">
                  {{ col.label }} <ZIcon name="sort" :size="12" :class="{ 'is-active': sort.key === col.key }" />
                </button>
                <span v-else>{{ col.label }}</span>
                <span v-if="col.key === 'price'" class="unit-h"> ({{ fmt.moneyParts(1).unit }})</span>
                <span v-if="col.key === 'change'" class="periods" role="group" :aria-label="data.table.periodLabel">
                  <button v-for="p in data.table.periods" :key="p.id" type="button" :aria-pressed="period === p.id" @click="period = p.id">
                    {{ p.label }}
                  </button>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id">
              <td class="c-fav">
                <button
                  type="button"
                  class="fav"
                  :class="{ 'is-on': favorites.has(c.id) }"
                  :aria-pressed="favorites.has(c.id)"
                  :aria-label="t(favorites.has(c.id) ? data.table.favorite.remove : data.table.favorite.add, { name: c.name })"
                  @click="toggleFavorite(c.id)"
                >
                  <ZIcon :name="favorites.has(c.id) ? 'star-solid' : 'star'" :size="15" />
                </button>
              </td>
              <td class="c-rank num">{{ rankOf[c.id] }}</td>
              <th class="c-name" scope="row">
                <a :href="tradeHref(common.links, c) ?? buyHref(common.links, c)" class="coin">
                  <ZCoinIcon :glyph="c.glyph" :tone="c.tone" :size="28" />
                  <span><strong>{{ c.ticker }}</strong><small>{{ c.name }}</small></span>
                </a>
              </th>
              <td class="c-price num">
                <span :key="c.seq" class="tick" :class="flash(c)">{{ fmt.moneyParts(c.price).n }}<span class="unit"> {{ fmt.moneyParts(c.price).unit }}</span></span>
              </td>
              <td class="c-change num" :class="c.change[period] >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(c.change[period]) }}</td>
              <td class="c-chart"><Sparkline :values="c.spark" :up="c.change['24h'] >= 0" /></td>
              <td class="c-cap num">{{ fmt.compact(c.cap) }}</td>
              <td class="c-volume num">{{ fmt.compact(c.volume) }}</td>
              <td class="c-action">
                <a :href="buyHref(common.links, c)">{{ data.table.buy }}<span class="sr-only"> {{ c.name }}</span></a>
                <a v-if="tradeHref(common.links, c)" :href="tradeHref(common.links, c)">{{ data.table.trade }}<span class="sr-only"> {{ c.name }}</span></a>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length" class="markets__empty" role="status">{{ emptyText }}</p>
      </div>
      <p class="markets__note">{{ data.note }}</p>
    </div>
  </SiteLayout>
</template>

<style scoped>
.markets__head { margin-bottom: 40px; }
.markets__head .lede { margin-top: 18px; }
.markets__bar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-top: 64px; border-bottom: 1px solid var(--color-line-default); scroll-margin-top: calc(var(--space-nav-height) + 16px); }
.markets__bar .z-tabs { border-bottom: 0; }
.markets__search { display: flex; align-items: center; gap: 8px; width: 240px; height: 36px; margin-bottom: 8px; padding: 0 12px; border-radius: var(--radius-pill); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-muted); }
.markets__search:focus-within { border-color: var(--color-brand-secondary-300); }
.markets__search input { flex: 1; min-width: 0; background: none; border: 0; outline: none; font-size: 13px; color: var(--color-text-default); }
.markets__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.markets__table-head { margin: 40px 0 16px; }
.markets__table-title { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.markets__table-head p { margin-top: 4px; font-size: 13px; color: var(--color-text-muted); }

table { width: 100%; border-collapse: collapse; font-size: 14px; }
thead th { position: sticky; top: var(--space-nav-height); z-index: 2; height: 42px; padding: 0 10px; background: var(--color-bg-surface-2); font-size: var(--font-size-small); font-weight: var(--font-weight-medium); color: var(--color-text-muted); text-align: right; white-space: nowrap; }
thead th:first-child { border-radius: var(--radius-md) 0 0 var(--radius-md); }
thead th:last-child { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
.th-sort { display: inline-flex; align-items: center; gap: 4px; color: inherit; }
.th-sort:hover { color: var(--color-text-default); }
.th-sort .is-active { color: var(--color-brand-primary-300); }
.periods { display: inline-flex; gap: 2px; margin-left: 8px; }
.periods button { padding: 2px 5px; border-radius: 4px; font-size: 11px; color: var(--color-text-dim); }
.periods button[aria-pressed='true'] { color: var(--color-brand-primary-300); background: var(--fill-1); }
tbody tr { border-bottom: 1px solid var(--color-line-default); transition: background-color var(--motion-duration-hover); }
tbody tr:hover { background: var(--fill-1); }
td, tbody th { height: 64px; padding: 0 10px; text-align: right; white-space: nowrap; font-weight: var(--font-weight-medium); }
.c-fav { width: 36px; text-align: center; padding: 0 0 0 6px; }
.c-rank { width: 36px; text-align: left; color: var(--color-text-dim); }
.c-name, thead .c-name { text-align: left; }
.coin { display: inline-flex; align-items: center; gap: 12px; }
.coin strong { display: block; font-weight: var(--font-weight-semibold); }
.coin small { display: block; font-size: var(--font-size-small); color: var(--color-text-muted); font-weight: var(--font-weight-regular); }
.coin:hover strong { color: var(--color-brand-primary-300); }
.tick { padding: 3px 6px; border-radius: 4px; }
.c-chart { width: 120px; }
.c-chart .spark { margin-left: auto; }
.c-action a { font-size: 13px; color: var(--color-brand-primary-300); }
.c-action a + a { margin-left: 14px; padding-left: 14px; border-left: 1px solid var(--color-line-strong); }
.c-action a:hover { color: var(--color-text-default); }
.fav { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--color-text-dim); transition: color var(--motion-duration-hover), transform var(--motion-duration-hover) var(--motion-ease-out); }
.fav:hover { color: var(--color-text-default); transform: scale(1.1); }
.fav.is-on { color: var(--color-brand-primary-300); }
.unit-h { display: none; }
.markets__empty { padding: 48px 0; text-align: center; color: var(--color-text-muted); }
.markets__note { margin-top: 24px; font-size: var(--font-size-small); color: var(--color-text-dim); }

@media (max-width: 1100px) { .c-cap, .c-chart { display: none; } }
@media (max-width: 900px) {
  .markets__bar { flex-direction: column-reverse; align-items: stretch; margin-top: 40px; }
  .markets__search { width: 100%; }
  .markets__chips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-inline: calc(var(--space-gutter-mobile) * -1); padding-inline: var(--space-gutter-mobile); }
  .c-volume, .c-action, .c-rank { display: none; }
  table { font-size: 13px; }
  td, tbody th { height: 60px; padding: 0 4px; }
  thead th { padding: 0 4px; }
  .c-fav { width: 28px; padding: 0; }
  .coin { gap: 8px; }
  .coin :deep(.z-coin-icon) { --s: 24px !important; }
  .unit { display: none; }
  .unit-h { display: inline; }
  .periods { display: flex; justify-content: flex-end; margin: 2px 0 0; }
}
</style>
