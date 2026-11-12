<script setup>
import { ref } from 'vue';
import ZIcon from '../ui/ZIcon.vue';

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  labels: { type: Object, required: true }, // { show, hide }
  autocomplete: { type: String, default: 'current-password' },
  error: { type: String, default: '' },
  describedby: { type: String, default: '' },
});
const model = defineModel({ default: '' });
const visible = ref(false);
const input = ref(null);
defineExpose({ focus: () => input.value?.focus() });
const describedBy = [props.error ? `${props.id}-error` : '', props.describedby].filter(Boolean).join(' ') || undefined;
</script>

<template>
  <div class="pwf">
    <label class="z-label" :for="id">{{ label }}</label>
    <div class="pwf__wrap">
      <input
        :id="id"
        ref="input"
        v-model="model"
        class="z-input"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error ${describedby}`.trim() : describedby || undefined"
      />
      <button type="button" class="pwf__toggle" :aria-label="visible ? labels.hide : labels.show" :aria-pressed="visible" @click="visible = !visible">
        <ZIcon :name="visible ? 'eye-off' : 'eye'" :size="18" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="z-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.pwf__wrap { position: relative; }
.pwf__wrap .z-input { padding-right: 48px; }
.pwf__toggle { position: absolute; right: 6px; top: 50%; display: grid; place-items: center; width: 36px; height: 36px; margin-top: -18px; border-radius: var(--radius-sm); color: var(--color-text-muted); }
.pwf__toggle:hover { color: var(--color-text-default); background: var(--fill-1); }
</style>
