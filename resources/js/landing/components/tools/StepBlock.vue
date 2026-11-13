<script setup>
import ZIcon from '../ui/ZIcon.vue';

// Étape numérotée d'un widget (pastille + filet vertical), comme Recevoir / Envoyer.
defineProps({
  n: { type: Number, required: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  last: { type: Boolean, default: false },
});
</script>

<template>
  <section class="sb" :class="{ 'is-done': done, 'is-last': last }" :aria-label="title">
    <span class="sb__dot" aria-hidden="true"><ZIcon v-if="done" name="check" :size="12" /><template v-else>{{ n }}</template></span>
    <h2 class="sb__title">{{ title }}</h2>
    <div class="sb__body"><slot /></div>
  </section>
</template>

<style scoped>
.sb { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); column-gap: 14px; padding-bottom: 26px; }
.sb:not(.is-last)::before { content: ''; position: absolute; left: 13.5px; top: 34px; bottom: 4px; width: 1px; background: var(--color-line-default); }
.sb.is-done:not(.is-last)::before { background: var(--color-brand-primary-300); }
.sb__dot {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font-size: 12px; font-weight: var(--font-weight-semibold);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); color: var(--color-text-muted);
}
.is-done .sb__dot { background: color-mix(in srgb, var(--color-brand-primary) 40%, transparent); border-color: var(--color-brand-primary-300); color: var(--color-brand-primary-300); }
.sb__title { align-self: center; font-size: 15px; font-weight: var(--font-weight-semibold); }
.sb__body { grid-column: 2; margin-top: 14px; min-width: 0; }
</style>
