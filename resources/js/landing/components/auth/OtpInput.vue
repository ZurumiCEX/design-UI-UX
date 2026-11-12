<script setup>
import { ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';

// Code à 6 chiffres : saisie case par case, collage et remplissage automatique (SMS) acceptés.
const props = defineProps({
  label: { type: String, required: true },
  digitLabel: { type: String, required: true }, // « Chiffre {n} sur 6 »
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: '' },
});
const code = defineModel({ default: '' });
const { t } = useI18n();
const LENGTH = 6;
const digits = ref(Array.from({ length: LENGTH }, (_, i) => code.value[i] ?? ''));
const inputs = ref([]);

watch(digits, (d) => (code.value = d.join('')), { deep: true });

function focusAt(i) {
  inputs.value[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();
}
function fill(from, text) {
  const chars = text.replace(/\D/g, '').slice(0, LENGTH - from).split('');
  chars.forEach((c, k) => (digits.value[from + k] = c));
  focusAt(from + chars.length);
}
function onInput(i, e) {
  const v = e.target.value.replace(/\D/g, '');
  if (v.length > 1) return fill(i, v); // remplissage automatique
  digits.value[i] = v;
  e.target.value = v;
  if (v) focusAt(i + 1);
}
function onKeydown(i, e) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    e.preventDefault();
    digits.value[i - 1] = '';
    focusAt(i - 1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    focusAt(i - 1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    focusAt(i + 1);
  }
}
function onPaste(i, e) {
  e.preventDefault();
  fill(i, e.clipboardData?.getData('text') ?? '');
}
defineExpose({ focus: () => focusAt(digits.value.findIndex((d) => !d) === -1 ? LENGTH - 1 : digits.value.findIndex((d) => !d)) });
</script>

<template>
  <fieldset class="otp" :aria-describedby="describedby || undefined">
    <legend class="sr-only">{{ label }}</legend>
    <input
      v-for="(d, i) in digits"
      :key="i"
      :ref="(el) => (inputs[i] = el)"
      class="otp__box num"
      :value="d"
      inputmode="numeric"
      pattern="[0-9]*"
      :autocomplete="i === 0 ? 'one-time-code' : 'off'"
      :aria-label="t(digitLabel, { n: i + 1 })"
      :aria-invalid="invalid"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
      @focus="$event.target.select()"
    />
  </fieldset>
</template>

<style scoped>
.otp { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin: 0; padding: 0; border: 0; }
.otp__box {
  width: 100%; height: 56px; text-align: center; font-size: 22px; font-weight: var(--font-weight-semibold); border-radius: var(--radius-md);
  background: var(--fill-1); border: 1px solid var(--color-line-strong); caret-color: var(--color-brand-primary-300);
  transition: border-color var(--motion-duration-hover), box-shadow var(--motion-duration-hover);
}
.otp__box:focus { outline: none; border-color: var(--color-brand-secondary-300); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-secondary-300) 22%, transparent); }
.otp__box[aria-invalid='true'] { border-color: var(--color-state-down); }
</style>
