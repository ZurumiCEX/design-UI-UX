<script setup>
import { computed } from 'vue';

// Anneau de score de sécurité (0–100). Le nombre est toujours affiché en clair.
const props = defineProps({ score: { type: Number, required: true }, size: { type: Number, default: 88 }, label: { type: String, required: true } });
const C = 2 * Math.PI * 42;
const tone = computed(() => (props.score >= 80 ? 'is-good' : props.score >= 50 ? 'is-mid' : 'is-low'));
</script>

<template>
  <span class="score" :class="tone" :style="{ '--s': `${size}px` }" role="img" :aria-label="`${label} : ${score}/100`">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" class="score__track" />
      <circle cx="50" cy="50" r="42" class="score__bar" :stroke-dasharray="C" :stroke-dashoffset="C * (1 - score / 100)" />
    </svg>
    <strong class="num" aria-hidden="true">{{ score }}</strong>
  </span>
</template>

<style scoped>
.score { --tone: var(--color-state-up); position: relative; display: inline-grid; place-items: center; width: var(--s); height: var(--s); }
.score.is-mid { --tone: var(--color-state-warn); }
.score.is-low { --tone: var(--color-state-down); }
.score svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.score circle { fill: none; stroke-width: 7; }
.score__track { stroke: var(--color-line-default); }
.score__bar { stroke: var(--tone); stroke-linecap: round; transition: stroke-dashoffset 900ms var(--motion-ease-out); }
.score strong { font-size: calc(var(--s) * 0.28); font-weight: var(--font-weight-semibold); }
</style>
