<script setup>
import ZIcon from '../ui/ZIcon.vue';
import ZTag from '../ui/ZTag.vue';

// Grille de services. Chaque cellule affiche une mini-interface décrite par `item.ui`
// (title, meta, rows, cta) : ajouter un service = ajouter une entrée dans content/*.js.
defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});
</script>

<template>
  <section :id="data.id" class="section products">
    <div class="container">
      <ZTag v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title products__title" v-html="data.title" />

      <ul class="products__grid">
        <li v-for="item in data.items" :key="item.title" v-reveal class="cell">
          <div class="cell__stage" aria-hidden="true">
            <div class="mini">
              <div class="mini__head">
                <strong>{{ item.ui.title }}</strong><span>{{ item.ui.meta }}</span>
              </div>
              <template v-for="(row, r) in item.ui.rows" :key="r">
                <span v-if="row.divider" class="mini__divider">{{ row.divider }}</span>
                <div v-else-if="row.option" class="mini__row mini__row--option">
                  <span>{{ row.option }}</span>
                  <i class="mini__radio" :class="{ 'is-on': row.selected }" />
                </div>
                <div v-else class="mini__row">
                  <span class="mini__label">{{ row.label }}</span>
                  <span class="mini__value" :class="{ 'is-mono': row.mono }">{{ row.value }}</span>
                  <span v-if="row.coin" class="mini__coin">{{ row.coin }}</span>
                  <span v-else-if="row.ok" class="mini__side is-ok">{{ row.ok }}</span>
                  <span v-else-if="row.note" class="mini__side">{{ row.note }}</span>
                </div>
              </template>
              <span class="mini__cta">{{ item.ui.cta }}</span>
            </div>
          </div>
          <p class="cell__text"><strong>{{ item.title }}</strong> {{ item.text }}</p>
          <a class="cell__more label" :href="item.href">
            {{ data.more }}<span class="sr-only"> — {{ item.title }}</span> <ZIcon name="arrow-right" :size="12" />
          </a>
          <span class="cell__rule" aria-hidden="true" />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.products__title { margin-top: 26px; }
.products__grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 64px; border-top: 1px solid var(--color-line-default); }
.cell { position: relative; padding: 48px 44px 72px; border-bottom: 1px solid var(--color-line-default); }
.cell:nth-child(odd) { padding-left: 0; border-right: 1px solid var(--color-line-default); }
.cell__stage { display: grid; place-items: center; min-height: 290px; }
.cell__text { max-width: 34ch; margin-top: 28px; font-size: 14.5px; color: var(--color-text-muted); }
.cell__text strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }

/* A14 — mini-interface atténuée, rétablie au survol / focus. */
.mini {
  width: min(350px, 100%); padding: 16px; display: grid; gap: 8px; border-radius: var(--radius-lg);
  background: var(--color-bg-surface); border: 1px solid var(--color-line-default);
  opacity: 0.34; filter: saturate(0.3); transform: scale(0.97);
  transition: opacity var(--duration-rule) var(--motion-ease-out), filter var(--duration-rule) var(--motion-ease-out), transform var(--duration-rule) var(--motion-ease-out);
}
.mini__head { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px; }
.mini__head strong { font-size: 12.5px; color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.mini__row { position: relative; display: grid; gap: 1px; padding: 9px 12px; border-radius: var(--radius-md); background: var(--fill-1); }
.mini__row--option { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding-block: 12px; }
.mini__label { font-size: 10.5px; color: var(--color-text-muted); }
.mini__value { font-size: 15px; font-weight: var(--font-weight-semibold); }
.mini__value.is-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; font-weight: var(--font-weight-regular); }
.mini__coin, .mini__side { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--color-text-muted); }
.mini__coin { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--color-state-up); color: var(--ink); font-size: 10px; font-weight: var(--font-weight-bold); }
.mini__side.is-ok { color: var(--color-state-up); }
.mini__radio { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--color-text-dim); }
.mini__radio.is-on { background: var(--color-state-up); border-color: var(--color-state-up); }
.mini__divider { justify-self: center; display: grid; place-items: center; width: 22px; height: 22px; margin: -5px 0; z-index: 1; border-radius: 50%; background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 11px; color: var(--color-text-muted); }
.mini__cta { display: grid; place-items: center; height: 34px; margin-top: 2px; border-radius: var(--radius-md); background: var(--gradient-brand); font-size: 12px; font-weight: var(--font-weight-semibold); }

.cell__more {
  position: absolute; left: 44px; bottom: 26px; display: inline-flex; align-items: center; gap: 8px; color: var(--color-brand-primary-300);
  opacity: 0; transform: translateX(-14px);
  transition: opacity var(--motion-duration-hover) var(--motion-ease-out), transform var(--duration-rule) var(--motion-ease-out);
}
.cell:nth-child(odd) .cell__more { left: 0; }
/* Filet du bas : 24 px blanc → toute la largeur en dégradé (seule animation de largeur admise). */
.cell__rule { position: absolute; left: 44px; right: 44px; bottom: -1px; height: 1px; }
.cell:nth-child(odd) .cell__rule { left: 0; }
.cell__rule::before, .cell__rule::after { content: ''; position: absolute; left: 0; top: 0; height: 100%; }
.cell__rule::before { width: 24px; background: var(--color-text-default); transition: opacity var(--duration-rule); }
.cell__rule::after { width: 24px; background: var(--gradient-brand-soft); opacity: 0; transition: width var(--duration-rule) var(--motion-ease-out), opacity var(--motion-duration-hover); }

.cell:hover .mini, .cell:focus-within .mini { opacity: 1; filter: none; transform: none; }
.cell:hover .cell__more, .cell:focus-within .cell__more { opacity: 1; transform: none; }
.cell:hover .cell__rule::after, .cell:focus-within .cell__rule::after { width: 100%; opacity: 1; }
.cell:hover .cell__rule::before, .cell:focus-within .cell__rule::before { opacity: 0; }

/* Mobile et écrans tactiles : états de survol affichés en permanence. */
@media (max-width: 900px), (hover: none) {
  .mini { opacity: 1; filter: none; transform: none; }
  .cell__more { opacity: 1; transform: none; }
  .cell__rule::after { width: 100%; opacity: 1; }
  .cell__rule::before { opacity: 0; }
}
@media (max-width: 900px) {
  .products__grid { grid-template-columns: 1fr; margin-top: 40px; }
  .cell, .cell:nth-child(odd) { padding: 36px 0 68px; border-right: 0; }
  .cell__more, .cell__rule { left: 0; right: 0; }
  .cell__stage { min-height: 0; }
}
</style>
