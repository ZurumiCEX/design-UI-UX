<script setup>
import { computed } from 'vue';

// Courbe miniature (tendance 24 h). La couleur suit la variation.
const props = defineProps({
  values: { type: Array, required: true },
  up: { type: Boolean, default: true },
  width: { type: Number, default: 96 },
  height: { type: Number, default: 32 },
});

const paths = computed(() => {
  const v = props.values;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * props.width, 2 + (1 - (y - min) / span) * (props.height - 4)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return { line, area: `${line} L${props.width} ${props.height} L0 ${props.height} Z` };
});
</script>

<template>
  <svg class="spark" :class="up ? 'is-up' : 'is-down'" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
    <path class="spark__area" :d="paths.area" />
    <path class="spark__line" :d="paths.line" />
  </svg>
</template>

<style scoped>
.spark { display: block; overflow: visible; }
.spark__area { fill: currentColor; opacity: 0.12; }
.spark__line { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
</style>
