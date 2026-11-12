<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { buyHref, tradeHref } from '../../market/links.js';
import ZCoinIcon from '../ui/ZCoinIcon.vue';
import ZIcon from '../ui/ZIcon.vue';

// Trois cartes : tendances (volume), nouveautés, meilleures performances (24 h).
const props = defineProps({
  coins: { type: Array, required: true }, // flux de cours
  data: { type: Object, required: true }, // pages.markets
  links: { type: Object, required: true },
});
const emit = defineEmits(['show']);
const { fmt } = useI18n();

const volatile = computed(() => props.coins.filter((c) => c.category !== 'stable'));
const lists = computed(() => ({
  trending: [...volatile.value].sort((a, b) => b.volume - a.volume).slice(0, 3),
  newest: props.coins.filter((c) => c.isNew).slice(0, 3),
  gainers: [...volatile.value].sort((a, b) => b.change['24h'] - a.change['24h']).slice(0, 3),
}));
const href = (c) => tradeHref(props.links, c) ?? buyHref(props.links, c);
</script>

<template>
  <div class="hl">
    <section v-for="card in data.highlights" :key="card.id" v-reveal class="hl__card z-panel" :aria-labelledby="`hl-${card.id}`">
      <h2 :id="`hl-${card.id}`" class="hl__title">
        <button type="button" :aria-label="`${card.title} — ${data.showInTable}`" @click="emit('show', card.id)">
          {{ card.title }} <ZIcon name="chevron-right" :size="14" />
        </button>
      </h2>
      <ul>
        <li v-for="c in lists[card.id]" :key="c.id">
          <a class="hl__row" :href="href(c)">
            <ZCoinIcon :glyph="c.glyph" :tone="c.tone" :size="20" />
            <span class="hl__ticker">{{ c.ticker }}</span>
            <span class="hl__price num">{{ fmt.xof(c.price) }}</span>
            <span class="hl__change num" :class="c.change['24h'] >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(c.change['24h']) }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.hl__card { padding: 18px 14px 10px; }
.hl__title button { display: inline-flex; align-items: center; gap: 4px; padding: 0 6px 10px; font-size: 14px; font-weight: var(--font-weight-semibold); }
.hl__title button:hover { color: var(--color-brand-primary-300); }
.hl__row {
  display: grid; grid-template-columns: 20px minmax(0, 1fr) auto 76px; align-items: center; gap: 10px; padding: 9px 6px; border-radius: var(--radius-sm);
  font-size: 13px; transition: background-color var(--motion-duration-hover);
}
.hl__row:hover { background: var(--fill-1); }
.hl__ticker { font-weight: var(--font-weight-semibold); }
.hl__price { text-align: right; }
.hl__change { text-align: right; }
@media (max-width: 1000px) {
  .hl { grid-template-columns: 1fr; gap: 12px; }
}
</style>
