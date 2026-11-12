<script setup>
// Carte d'un actif : pastille, nom, symbole, cours et variation.
defineProps({ coin: { type: Object, required: true } });
</script>

<template>
  <div class="z-coin">
    <span class="z-coin__icon" :style="{ '--tone': coin.tone }" aria-hidden="true">{{ coin.glyph }}</span>
    <span class="z-coin__body">
      <span class="z-coin__name">{{ coin.name }} <small>{{ coin.ticker }}</small></span>
      <span class="z-coin__price">
        {{ coin.price }} <span :class="coin.up ? 'is-up' : 'is-down'">{{ coin.change }}</span>
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
.z-coin__icon {
  display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 50%;
  background: var(--tone, var(--color-brand-primary)); font-size: 12px; font-weight: var(--font-weight-semibold);
}
.z-coin__body { display: grid; gap: 3px; line-height: 1.2; }
.z-coin__name { font-size: 12.5px; font-weight: var(--font-weight-medium); }
.z-coin__name small { font-size: 10.4px; color: var(--color-text-dim); font-weight: var(--font-weight-regular); }
.z-coin__price { font-size: 11.5px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.is-up { color: var(--color-state-up); margin-left: 8px; }
.is-down { color: var(--color-state-down); margin-left: 8px; }
</style>
