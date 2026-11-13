<script setup>
import SiteLayout from '../layout/SiteLayout.vue';
import TutorialSteps from './TutorialSteps.vue';

// Gabarit des pages outils : titre, widget à gauche, tutoriel à droite.
defineProps({
  page: { type: String, required: true },
  data: { type: Object, required: true }, // { title, text, tutorial }
  step: { type: Number, default: 0 }, // étape en cours, remontée par le widget
});
</script>

<template>
  <SiteLayout :page="page">
    <div class="container page tool">
      <header class="tool__head">
        <h1 v-split class="title" v-html="data.title" />
        <p v-reveal class="lede">{{ data.text }}</p>
      </header>
      <div class="tool__grid">
        <div v-reveal="200" class="tool__widget"><slot /></div>
        <TutorialSteps v-reveal="350" class="tool__tuto" :data="data.tutorial" :active="step" />
      </div>
    </div>
  </SiteLayout>
</template>

<style scoped>
.tool { position: relative; }
.tool::before {
  content: ''; position: absolute; left: 10%; top: 0; width: 50%; height: 420px; pointer-events: none; z-index: -1;
  background: radial-gradient(closest-side, var(--glow-brand), transparent); opacity: 0.35;
}
.tool__head { max-width: 680px; }
.tool__head .lede { margin-top: 18px; }
.tool__grid { display: grid; grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: 40px; align-items: start; margin-top: 48px; }
.tool__grid > * { min-width: 0; }
.tool__tuto { position: sticky; top: calc(var(--space-nav-height) + 24px); max-width: 460px; }
@media (max-width: 960px) {
  .tool__grid { grid-template-columns: minmax(0, 1fr); gap: 24px; margin-top: 32px; }
  .tool__tuto { position: static; max-width: none; }
}
</style>
