<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZIcon from './ZIcon.vue';

// Zone de dépôt d'un fichier (glisser-déposer, clic ou clavier) avec aperçu et contrôle du format et du poids.
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  accept: { type: String, default: 'image/jpeg,image/png,image/webp,application/pdf' },
  maxSize: { type: Number, default: 10 * 1024 * 1024 },
  errors: { type: Object, required: true }, // { type, size }
  remove: { type: String, required: true },
  capture: { type: String, default: undefined }, // 'user' : appareil photo frontal sur mobile
  invalid: { type: Boolean, default: false },
});
const file = defineModel({ default: null });
const { t } = useI18n();
const input = ref(null);
const over = ref(false);
const preview = ref('');
const error = ref('');

function take(list) {
  const f = list?.[0];
  if (!f) return;
  error.value = '';
  if (!props.accept.split(',').includes(f.type)) return void (error.value = t(props.errors.type, { name: f.name }));
  if (f.size > props.maxSize) return void (error.value = t(props.errors.size, { name: f.name, max: Math.round(props.maxSize / 1048576) }));
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = f.type.startsWith('image/') ? URL.createObjectURL(f) : '';
  file.value = f;
}
function clear() {
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = '';
  file.value = null;
}
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value));
</script>

<template>
  <div class="fd">
    <div v-if="file" class="fd__file">
      <img v-if="preview" :src="preview" alt="" />
      <span v-else class="fd__pdf"><ZIcon name="file" :size="20" /></span>
      <span class="fd__name">{{ file.name }}</span>
      <button type="button" :aria-label="t(remove, { name: file.name })" @click="clear"><ZIcon name="close" :size="14" /></button>
    </div>
    <div
      v-else
      class="fd__zone"
      :class="{ 'is-over': over, 'is-invalid': invalid || error }"
      role="button"
      tabindex="0"
      :aria-label="label"
      @click="input.click()"
      @keydown.enter.prevent="input.click()"
      @keydown.space.prevent="input.click()"
      @dragenter.prevent="over = true"
      @dragover.prevent="over = true"
      @dragleave.prevent="over = false"
      @drop.prevent="over = false; take($event.dataTransfer?.files)"
    >
      <ZIcon name="upload" :size="22" />
      <strong>{{ label }}</strong>
      <span v-if="hint">{{ hint }}</span>
    </div>
    <input ref="input" type="file" hidden :accept="accept" :capture="capture" @change="take($event.target.files); $event.target.value = ''" />
    <p v-if="error" class="z-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.fd__zone {
  display: grid; justify-items: center; gap: 6px; padding: 26px 16px; border-radius: var(--radius-md); border: 1px dashed var(--color-line-strong);
  text-align: center; color: var(--color-brand-secondary-300); cursor: pointer; transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover);
}
.fd__zone:hover, .fd__zone.is-over { border-color: var(--color-brand-secondary-300); background: color-mix(in srgb, var(--color-brand-secondary) 10%, transparent); }
.fd__zone.is-invalid { border-color: var(--color-state-down); }
.fd__zone strong { font-size: 14px; color: var(--color-text-default); }
.fd__zone span { font-size: 12px; color: var(--color-text-muted); }
.fd__file { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.fd__file img, .fd__pdf { flex: none; width: 56px; height: 56px; border-radius: var(--radius-sm); object-fit: cover; }
.fd__pdf { display: grid; place-items: center; background: var(--fill-2); color: var(--color-brand-primary-300); }
.fd__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.fd__file button { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--color-text-muted); }
.fd__file button:hover { background: var(--fill-2); color: var(--color-text-default); }
</style>
