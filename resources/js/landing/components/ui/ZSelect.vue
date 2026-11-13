<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import ZCoinIcon from './ZCoinIcon.vue';
import ZIcon from './ZIcon.vue';

// Liste déroulante accessible (bouton + listbox), avec recherche optionnelle.
// Clavier : ↓/↑ pour parcourir, Entrée pour choisir, Échap pour fermer.
const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  // [{ value, label, short?, sub?, subClass?, glyph?, tone?, icon?, description?, group?, keywords? }]
  // Les options d'un même `group` doivent se suivre.
  options: { type: Array, required: true },
  label: { type: String, required: true }, // nom accessible
  placeholder: { type: String, default: '' }, // affiché tant qu'aucune option n'est choisie
  searchable: { type: Boolean, default: false },
  searchLabel: { type: String, default: '' },
  empty: { type: String, default: '' },
  align: { type: String, default: 'left' }, // left | right
  variant: { type: String, default: 'chip' }, // chip | plain | field
});
const emit = defineEmits(['update:modelValue']);

const uid = `zs-${Math.random().toString(36).slice(2, 8)}`;
const open = ref(false);
const query = ref('');
const active = ref(0);
const root = ref(null);
const button = ref(null);
const list = ref(null);
const search = ref(null);

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? (props.placeholder ? null : props.options[0]));
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => `${o.label} ${o.short ?? ''} ${o.description ?? ''} ${o.keywords ?? ''}`.toLowerCase().includes(q));
});
watch(query, () => (active.value = 0));

function scrollActive() {
  nextTick(() => document.getElementById(`${uid}-${active.value}`)?.scrollIntoView({ block: 'nearest' }));
}
async function show() {
  open.value = true;
  query.value = '';
  active.value = Math.max(0, filtered.value.findIndex((o) => o.value === props.modelValue));
  await nextTick();
  (search.value ?? list.value)?.focus();
  scrollActive();
  document.addEventListener('pointerdown', onOutside);
}
function hide(refocus = true) {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener('pointerdown', onOutside);
  if (refocus) button.value?.focus();
}
function onOutside(e) {
  if (!root.value?.contains(e.target)) hide(false);
}
function choose(option) {
  emit('update:modelValue', option.value);
  hide();
}
function move(delta) {
  const n = filtered.value.length;
  if (!n) return;
  active.value = (active.value + delta + n) % n;
  scrollActive();
}
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); const o = filtered.value[active.value]; if (o) choose(o); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); }
  else if (e.key === 'Tab') hide(false);
}
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside));
</script>

<template>
  <div ref="root" class="zs" :class="[`zs--${variant}`, { 'is-open': open }]">
    <button
      ref="button"
      type="button"
      class="zs__btn"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="open ? `${uid}-list` : undefined"
      :aria-label="`${label} : ${selected?.label ?? placeholder}`"
      @click="open ? hide() : show()"
      @keydown.down.prevent="show()"
    >
      <ZCoinIcon v-if="selected?.glyph" :glyph="selected.glyph" :tone="selected.tone" :size="20" />
      <ZIcon v-else-if="selected?.icon" :name="selected.icon" :size="16" class="zs__btn-icon" />
      <span class="zs__value" :class="{ 'is-placeholder': !selected }">{{ selected ? selected.short ?? selected.label : placeholder }}</span>
      <ZIcon name="chevron" :size="14" class="zs__chev" />
    </button>

    <div v-if="open" class="zs__panel" :class="`zs__panel--${align}`" @keydown="onKey">
      <input
        v-if="searchable"
        ref="search"
        v-model="query"
        class="zs__search"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="true"
        :aria-label="searchLabel"
        :aria-controls="`${uid}-list`"
        :aria-activedescendant="filtered.length ? `${uid}-${active}` : undefined"
        :placeholder="searchLabel"
      />
      <ul
        :id="`${uid}-list`"
        ref="list"
        class="zs__list"
        role="listbox"
        :aria-label="label"
        :tabindex="searchable ? -1 : 0"
        :aria-activedescendant="!searchable && filtered.length ? `${uid}-${active}` : undefined"
      >
        <template v-for="(o, i) in filtered" :key="o.value">
        <li v-if="o.group && o.group !== filtered[i - 1]?.group" class="zs__group" role="presentation">{{ o.group }}</li>
        <li
          :id="`${uid}-${i}`"
          role="option"
          class="zs__option"
          :class="{ 'is-active': i === active }"
          :aria-selected="o.value === modelValue"
          @click="choose(o)"
          @pointermove="active = i"
        >
          <ZCoinIcon v-if="o.glyph" :glyph="o.glyph" :tone="o.tone" :size="22" />
          <span v-else-if="o.icon" class="zs__icon"><ZIcon :name="o.icon" :size="16" /></span>
          <span class="zs__text">
            <span class="zs__label">{{ o.label }}</span>
            <span v-if="o.description" class="zs__desc">{{ o.description }}</span>
          </span>
          <span v-if="o.sub" class="zs__sub num" :class="o.subClass">{{ o.sub }}</span>
          <ZIcon v-if="o.value === modelValue" name="check" :size="14" class="zs__check" />
        </li>
        </template>
        <li v-if="!filtered.length" class="zs__empty" role="presentation">{{ empty }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.zs { position: relative; }
.zs__btn {
  display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px 0 8px; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: var(--font-weight-semibold); white-space: nowrap;
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default);
  transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover);
}
.zs__btn:hover, .zs.is-open .zs__btn { border-color: var(--color-line-strong); background: var(--fill-2); }
.zs--plain .zs__btn { background: none; border-color: transparent; padding: 0 6px 0 0; height: auto; font-size: inherit; }
.zs--field .zs__btn { width: 100%; height: 48px; padding: 0 14px; border-radius: var(--radius-md); background: var(--fill-1); border-color: var(--color-line-strong); font-weight: var(--font-weight-medium); font-size: 15px; }
.zs--field .zs__value { margin-right: auto; }
.zs__value.is-placeholder { color: var(--color-text-dim); font-weight: var(--font-weight-regular); }
.zs__chev { color: var(--color-text-muted); transition: transform var(--duration-panel) var(--motion-ease-out); }
.zs.is-open .zs__chev { transform: rotate(180deg); }
.zs__panel {
  position: absolute; top: calc(100% + 6px); z-index: 30; width: max(100%, 240px); padding: 6px; display: grid; gap: 6px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); box-shadow: 0 24px 60px -16px var(--ink);
  animation: zs-in var(--duration-panel) var(--motion-ease-out);
}
.zs__panel--left { left: 0; }
.zs__panel--right { right: 0; }
@keyframes zs-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } }
.zs__search { height: 36px; padding: 0 10px; border-radius: var(--radius-sm); background: var(--fill-1); border: 1px solid var(--color-line-default); font-size: 13px; }
.zs__search:focus { outline: none; border-color: var(--color-brand-secondary-300); }
.zs__list { max-height: 280px; overflow-y: auto; overscroll-behavior: contain; }
.zs__list:focus { outline: none; }
.zs__option { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer; }
.zs__option.is-active { background: var(--fill-2); }
.zs__label { font-weight: var(--font-weight-medium); }
.zs__text { display: grid; min-width: 0; }
.zs__desc { font-size: 11.5px; color: var(--color-text-muted); }
.zs__icon { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: var(--radius-sm); background: var(--fill-2); color: var(--color-brand-primary-300); }
.zs__btn-icon { color: var(--color-brand-primary-300); }
.zs__group { padding: 10px 8px 4px; font-size: 10.5px; font-weight: var(--font-weight-semibold); letter-spacing: var(--font-tracking-label); text-transform: uppercase; color: var(--color-text-dim); }
.zs__sub { margin-left: auto; font-size: 12px; color: var(--color-text-muted); }
.zs__check { color: var(--color-brand-primary-300); flex: none; }
.zs__sub + .zs__check { margin-left: 4px; }
.zs__text + .zs__check { margin-left: auto; }
.zs__empty { padding: 10px 8px; font-size: 13px; color: var(--color-text-dim); }
</style>
