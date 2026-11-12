<script setup>
import { computed } from 'vue';
import { USDT_XOF } from '../../content/data.js';
import { useI18n } from '../../composables/useI18n.js';
import { pairHref } from '../../market/links.js';

// Bandeau défilant des paires (pause au survol, arrêté en mouvement réduit).
const props = defineProps({
  coins: { type: Array, required: true },
  pairs: { type: Array, required: true },
  links: { type: Object, required: true },
  label: { type: String, required: true },
});
const { fmt } = useI18n();
const items = computed(() =>
  props.pairs.map((p) => {
    const c = props.coins.find((x) => x.id === p.coin);
    const price = p.quote === 'XOF' ? c.price : c.price / USDT_XOF;
    return { ...p, price, change: c.change['24h'] };
  }),
);
</script>

<template>
  <nav class="strip" :aria-label="label">
    <div class="strip__track">
      <ul v-for="copy in 2" :key="copy" :aria-hidden="copy > 1 ? 'true' : undefined">
        <li v-for="p in items" :key="p.id">
          <a :href="pairHref(links, p.id)" :tabindex="copy > 1 ? -1 : undefined">
            <strong>{{ p.base }}/{{ p.quote }}</strong>
            <span class="num" :class="p.change >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(p.change) }}</span>
            <span class="num">{{ fmt.price(p.price) }}</span>
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.strip {
  overflow: hidden; height: 34px; border-block: 1px solid var(--color-line-default); background: var(--color-bg-base);
  mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
}
.strip__track { display: flex; width: max-content; animation: strip 70s linear infinite; }
.strip:hover .strip__track, .strip:focus-within .strip__track { animation-play-state: paused; }
.strip ul { display: flex; }
.strip a { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 18px; font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
.strip a:hover strong { color: var(--color-brand-primary-300); }
.strip strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
@keyframes strip { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .strip { overflow-x: auto; } .strip__track { animation: none; } }
</style>
