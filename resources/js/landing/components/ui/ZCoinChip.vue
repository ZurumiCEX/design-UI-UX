<script setup>
import { useI18n } from '../../composables/useI18n.js';
import ZCoinIcon from './ZCoinIcon.vue';

// Carte d'un actif : pastille, nom, symbole, cours (XOF) et variation 24 h.
defineProps({ coin: { type: Object, required: true } });
const { fmt } = useI18n();
</script>

<template>
  <div class="z-coin">
    <ZCoinIcon :glyph="coin.glyph" :tone="coin.tone" />
    <span class="z-coin__body">
      <span class="z-coin__name">{{ coin.name }} <small>{{ coin.ticker }}</small></span>
      <span class="z-coin__price">
        {{ fmt.money(coin.price) }} <span :class="coin.change['24h'] >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(coin.change['24h']) }}</span>
      </span>
    </span>
  </div>
</template>

<style scoped>
.z-coin {
  display: flex; align-items: center; gap: 10px; min-width: 176px; padding: 12px 18px 12px 12px;
  background: var(--color-bg-surface); border: 1px solid var(--color-line-default); border-radius: var(--radius-md);
  white-space: nowrap; text-align: left;
}
.z-coin__body { display: grid; gap: 3px; line-height: 1.2; }
.z-coin__name { font-size: 12.5px; font-weight: var(--font-weight-medium); }
.z-coin__name small { font-size: 10.4px; color: var(--color-text-dim); font-weight: var(--font-weight-regular); }
.z-coin__price { font-size: 11.5px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.is-up, .is-down { margin-left: 8px; }
</style>
