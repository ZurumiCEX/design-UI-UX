<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZIcon from './ZIcon.vue';

// Zone de dépôt de fichiers (glisser-déposer, clic ou clavier) avec aperçu et contrôle du format et du poids.
// max = 1 : v-model est un fichier (ou null). max > 1 : v-model est une liste de fichiers (max éléments).
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  accept: { type: String, default: 'image/jpeg,image/png,image/webp,application/pdf' },
  maxSize: { type: Number, default: 10 * 1024 * 1024 },
  max: { type: Number, default: 1 },
  errors: { type: Object, required: true }, // { type, size, count? }
  remove: { type: String, required: true },
  capture: { type: String, default: undefined }, // 'user' : appareil photo frontal sur mobile
  invalid: { type: Boolean, default: false },
});
const model = defineModel({ default: null });
const { t } = useI18n();
const input = ref(null);
const over = ref(false);
const error = ref('');
const previews = reactive(new Map()); // fichier → URL d'aperçu (images)

const multi = computed(() => props.max > 1);
const files = computed(() => (multi.value ? model.value ?? [] : model.value ? [model.value] : []));
const full = computed(() => files.value.length >= props.max);

function check(f) {
  if (!props.accept.split(',').includes(f.type)) return t(props.errors.type, { name: f.name });
  if (f.size > props.maxSize) return t(props.errors.size, { name: f.name, max: Math.round(props.maxSize / 1048576) });
  return '';
}
function take(list) {
  const incoming = [...(list ?? [])];
  if (!incoming.length) return;
  error.value = '';
  const room = multi.value ? props.max - files.value.length : 1;
  if (multi.value && incoming.length > room) error.value = t(props.errors.count ?? props.errors.type, { max: props.max, name: '' });
  const ok = [];
  for (const f of incoming.slice(0, room)) {
    const e = check(f);
    if (e) { error.value = e; continue; }
    if (f.type.startsWith('image/')) previews.set(f, URL.createObjectURL(f));
    ok.push(f);
  }
  if (!ok.length) return;
  if (multi.value) model.value = [...files.value, ...ok];
  else {
    files.value.forEach(drop);
    model.value = ok[0];
  }
}
function drop(f) {
  const url = previews.get(f);
  if (url) URL.revokeObjectURL(url);
  previews.delete(f);
}
function clear(f) {
  drop(f);
  error.value = '';
  model.value = multi.value ? files.value.filter((x) => x !== f) : null;
}
onBeforeUnmount(() => previews.forEach((url) => URL.revokeObjectURL(url)));
</script>

<template>
  <div class="fd">
    <ul v-if="files.length" class="fd__list">
      <li v-for="f in files" :key="f.name + f.size + f.lastModified" class="fd__file">
        <img v-if="previews.get(f)" :src="previews.get(f)" alt="" />
        <span v-else class="fd__pdf"><ZIcon name="file" :size="20" /></span>
        <span class="fd__name">{{ f.name }}</span>
        <button type="button" :aria-label="t(remove, { name: f.name })" @click="clear(f)"><ZIcon name="close" :size="14" /></button>
      </li>
    </ul>
    <div
      v-if="!full"
      class="fd__zone"
      :class="{ 'is-over': over, 'is-invalid': invalid || error, 'is-compact': files.length }"
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
      <span v-if="multi" class="fd__count num">{{ files.length }} / {{ max }}</span>
    </div>
    <input ref="input" type="file" hidden :accept="accept" :capture="capture" :multiple="multi" @change="take($event.target.files); $event.target.value = ''" />
    <p v-if="error" class="z-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.fd { display: grid; gap: 8px; }
.fd__zone {
  display: grid; justify-items: center; gap: 6px; padding: 26px 16px; border-radius: var(--radius-md); border: 1px dashed var(--color-line-strong);
  text-align: center; color: var(--color-brand-secondary-300); cursor: pointer; transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover);
}
.fd__zone.is-compact { padding: 14px 16px; }
.fd__zone:hover, .fd__zone.is-over { border-color: var(--color-brand-secondary-300); background: color-mix(in srgb, var(--color-brand-secondary) 10%, transparent); }
.fd__zone.is-invalid { border-color: var(--color-state-down); }
.fd__zone strong { font-size: 14px; color: var(--color-text-default); }
.fd__zone span { font-size: 12px; color: var(--color-text-muted); }
.fd__list { display: grid; gap: 8px; }
.fd__file { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.fd__file img, .fd__pdf { flex: none; width: 56px; height: 56px; border-radius: var(--radius-sm); object-fit: cover; }
.fd__list .fd__file img, .fd__list .fd__pdf { width: 40px; height: 40px; }
.fd__pdf { display: grid; place-items: center; background: var(--fill-2); color: var(--color-brand-primary-300); }
.fd__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.fd__file button { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--color-text-muted); }
.fd__file button:hover { background: var(--fill-2); color: var(--color-text-default); }
</style>
