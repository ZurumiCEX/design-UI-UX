<script setup>
import { ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';

// Mes ordres : onglets + état vide (déconnecté).
defineProps({
  data: { type: Object, required: true }, // pages.trade.orders
  links: { type: Object, required: true },
  user: { type: Object, default: null },
});
const { parts } = useI18n();
const tab = ref('open');
</script>

<template>
  <section class="op" :aria-label="data.label">
    <div class="z-tabs op__tabs" role="tablist" :aria-label="data.label">
      <button v-for="tb in data.tabs" :id="`op-tab-${tb.id}`" :key="tb.id" type="button" role="tab" class="z-tab" :aria-selected="tab === tb.id" aria-controls="op-panel" @click="tab = tb.id">
        {{ tb.label }}
      </button>
    </div>
    <div id="op-panel" class="op__panel" role="tabpanel" :aria-labelledby="`op-tab-${tab}`">
      <p v-if="!user" class="op__empty">
        <template v-for="(p, i) in parts(data.empty)" :key="i">
          <a v-if="p.slot === 'login'" :href="links.login">{{ data.login }}</a>
          <a v-else-if="p.slot === 'signup'" :href="links.signup">{{ data.signup }}</a>
          <template v-else>{{ p.text }}</template>
        </template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.op { display: flex; flex-direction: column; height: 100%; }
.op__tabs { padding: 0 16px; gap: 22px; overflow-x: auto; scrollbar-width: none; }
.op__tabs .z-tab { font-size: 13px; }
.op__panel { flex: 1; display: grid; place-items: center; min-height: 180px; padding: 24px; }
.op__empty { font-size: 13px; color: var(--color-text-muted); text-align: center; }
.op__empty a { color: var(--color-brand-primary-300); font-weight: var(--font-weight-medium); }
.op__empty a:hover { color: var(--color-text-default); }
</style>
