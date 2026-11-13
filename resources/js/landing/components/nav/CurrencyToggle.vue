<script setup>
import { useProfile } from '../../composables/useProfile.js';

// Devise d'affichage des prix (XOF ⇄ USD). Partagée avec le portefeuille et mémorisée.
defineProps({ label: { type: String, required: true } });
const { prefs } = useProfile();
const CURRENCIES = ['XOF', 'USD'];
</script>

<template>
  <div class="cur" role="group" :aria-label="label">
    <button v-for="c in CURRENCIES" :key="c" type="button" class="cur__btn label" :aria-pressed="prefs.currency === c" @click="prefs.currency = c">{{ c }}</button>
  </div>
</template>

<style scoped>
.cur { display: inline-flex; padding: 3px; border-radius: var(--radius-pill); background: var(--fill-1); border: 1px solid var(--color-line-default); }
.cur__btn { height: 26px; padding: 0 10px; border-radius: var(--radius-pill); color: var(--color-text-muted); transition: color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.cur__btn:hover { color: var(--color-text-default); }
.cur__btn[aria-pressed='true'] { color: var(--color-text-default); background: var(--color-bg-surface-2); box-shadow: inset 0 0 0 1px var(--color-line-strong); }
</style>
