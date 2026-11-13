<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';

// Formulaire public de signalement (repris de la livraison « Signalement », reconstruit sur le design du site).
// Anti-spam client : champ piège, durée minimale, addition, délai entre deux envois. Le serveur fait autorité
// (voir integration/signalement/StoreSignalementRequest.php) : garder les constantes alignées.
const props = defineProps({
  data: { type: Object, required: true }, // pages.report.form
  endpoint: { type: String, required: true }, // '#' = démo sans serveur
  csrfToken: { type: String, default: '' },
  supportMail: { type: String, required: true },
});
const { t, fmt } = useI18n();

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL = 25 * 1024 * 1024;
const MIN_DESC = 40;
const MIN_DELAY = 6000;
const COOLDOWN = 120000;
const TYPES_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const NATURES = ['faux-site', 'usurpation', 'investissement', 'compte', 'p2p', 'autre'];
const CURRENCIES = ['XOF', 'USDT', 'EUR', 'USD', 'Autre'];

const f = reactive({
  type: new URLSearchParams(window.location.search).get('type') ?? '',
  description: '', canal: '', date: '', lien: '', montant: '', devise: 'XOF',
  nom: '', telephone: '', email: '', consent: false,
  site_entreprise: '', // piège à robots : doit rester vide
  verification: '',
});
if (!NATURES.includes(f.type)) f.type = '';

const errors = reactive({});
const files = ref([]);
const previews = ref([]);
const fileError = ref('');
const dragging = ref(false);
const sending = ref(false);
const note = ref('');
const done = ref(false);
const reference = ref('');
const fileInput = ref(null);
const againBtn = ref(null);
let openedAt = Date.now();
let lastSentAt = 0;

const q = reactive({ a: 0, b: 0 });
function newQuestion() {
  q.a = 2 + Math.floor(Math.random() * 7);
  q.b = 2 + Math.floor(Math.random() * 7);
  f.verification = '';
}
onMounted(newQuestion);

const descLength = computed(() => f.description.trim().length);
const channelOptions = computed(() => [{ value: '', label: props.data.channelPick }, ...props.data.channels.map((c) => ({ value: c, label: c }))]);
const currencyOptions = computed(() => CURRENCIES.map((c) => ({ value: c, label: c === 'Autre' ? props.data.otherCurrency : c })));

const size = (o) => (o < 1048576 ? `${fmt.num(Math.round(o / 1024))} ${props.data.kb}` : `${fmt.num(o / 1048576, 1)} ${props.data.mb}`);
const totalSize = () => files.value.reduce((n, x) => n + x.size, 0);

function addFiles(list) {
  fileError.value = '';
  const e = props.data.fileErrors;
  for (const file of Array.from(list)) {
    if (files.value.length >= MAX_FILES) { fileError.value = t(e.count, { n: MAX_FILES }); break; }
    if (!TYPES_OK.includes(file.type)) { fileError.value = t(e.type, { name: file.name }); continue; }
    if (file.size > MAX_SIZE) { fileError.value = t(e.size, { name: file.name }); continue; }
    if (totalSize() + file.size > MAX_TOTAL) { fileError.value = e.total; continue; }
    if (files.value.some((x) => x.name === file.name && x.size === file.size)) { fileError.value = t(e.duplicate, { name: file.name }); continue; }
    files.value.push(file);
    previews.value.push(file.type === 'application/pdf' ? null : URL.createObjectURL(file));
  }
}
function removeFile(i) {
  if (previews.value[i]) URL.revokeObjectURL(previews.value[i]);
  files.value.splice(i, 1);
  previews.value.splice(i, 1);
  fileError.value = '';
}
function onDrop(e) {
  dragging.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
}
function onPick(e) {
  addFiles(e.target.files);
  e.target.value = '';
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = props.data.errors;
  if (!f.type) errors.type = e.type;
  if (descLength.value < MIN_DESC) errors.description = t(e.description, { n: MIN_DESC });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = e.email;
  if (parseInt(f.verification, 10) !== q.a + q.b) {
    errors.verification = e.verification;
    newQuestion();
  }
  if (!f.consent) errors.consent = e.consent;
  const first = Object.keys(errors)[0];
  if (first) {
    const el = document.querySelector(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus?.({ preventScroll: true });
  }
  return !first;
}

// Les erreurs disparaissent dès que le champ concerné devient valide.
watch(() => f.type, (v) => v && delete errors.type);
watch(() => f.description, () => descLength.value >= MIN_DESC && delete errors.description);
watch(() => f.email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && delete errors.email);
watch(() => f.consent, (v) => v && delete errors.consent);

// Référence affichée en démo (le serveur génère la vraie : ZRM-SIG-XXXXXX).
const demoReference = () => `ZRM-SIG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

async function send() {
  if (f.site_entreprise !== '') return; // robot : rejet silencieux
  if (Date.now() - openedAt < MIN_DELAY) return void (note.value = props.data.notes.tooFast);
  if (Date.now() - lastSentAt < COOLDOWN) return void (note.value = props.data.notes.cooldown);
  if (!validate()) return;

  sending.value = true;
  note.value = '';
  try {
    if (props.endpoint === '#') {
      await new Promise((r) => setTimeout(r, 900));
      reference.value = demoReference();
    } else {
      const body = new FormData();
      Object.entries(f).forEach(([k, v]) => body.append(k, v === true ? '1' : v));
      body.append('duree_remplissage', String(Date.now() - openedAt));
      files.value.forEach((file) => body.append('preuves[]', file));
      const res = await fetch(props.endpoint, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': props.csrfToken, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body,
      });
      if (res.status === 422) {
        const payload = await res.json();
        Object.entries(payload.errors || {}).forEach(([k, v]) => (errors[k.replace(/\.\d+$/, '')] = v[0]));
        note.value = props.data.notes.fix;
        return;
      }
      if (res.status === 429) return void (note.value = props.data.notes.rateLimited);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      reference.value = (await res.json()).reference;
    }
    lastSentAt = Date.now();
    done.value = true;
    document.body.style.overflow = 'hidden';
    nextTick(() => setTimeout(() => againBtn.value?.$el?.focus?.() ?? againBtn.value?.focus?.(), 600));
  } catch {
    note.value = t(props.data.notes.failed, { mail: props.supportMail });
  } finally {
    sending.value = false;
  }
}

function restart() {
  done.value = false;
  document.body.style.overflow = '';
  Object.assign(f, { type: '', description: '', canal: '', date: '', lien: '', montant: '', devise: 'XOF', nom: '', telephone: '', email: '', consent: false, site_entreprise: '', verification: '' });
  previews.value.forEach((u) => u && URL.revokeObjectURL(u));
  files.value = [];
  previews.value = [];
  fileError.value = '';
  for (const k of Object.keys(errors)) delete errors[k];
  note.value = '';
  newQuestion();
  openedAt = Date.now();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <form class="rf z-panel" novalidate @submit.prevent="send">
    <fieldset>
      <legend class="label">1 — {{ data.sections.nature }}</legend>
      <div class="rf__types" role="radiogroup" :aria-label="data.sections.nature">
        <template v-for="(n, i) in NATURES" :key="n">
          <input :id="`rt-${n}`" v-model="f.type" type="radio" name="type" :value="n" :data-field="i === 0 ? 'type' : null" />
          <label :for="`rt-${n}`">{{ data.natures[n].title }}<small>{{ data.natures[n].detail }}</small></label>
        </template>
      </div>
      <p v-if="errors.type" class="z-error">{{ errors.type }}</p>
    </fieldset>

    <fieldset>
      <legend class="label">2 — {{ data.sections.facts }}</legend>
      <label class="z-label" for="rf-desc">{{ data.fields.description }}</label>
      <textarea id="rf-desc" v-model="f.description" class="z-input rf__area" data-field="description" :placeholder="data.fields.descriptionPlaceholder" :aria-invalid="!!errors.description" aria-describedby="rf-desc-hint" />
      <p id="rf-desc-hint" class="z-hint num" :class="{ 'is-ok': descLength >= MIN_DESC }">{{ t(data.fields.descriptionCount, { n: descLength, min: MIN_DESC }) }}</p>
      <p v-if="errors.description" class="z-error">{{ errors.description }}</p>

      <div class="rf__row">
        <div>
          <span class="z-label">{{ data.fields.channel }} <span class="rf__opt">{{ data.optional }}</span></span>
          <ZSelect v-model="f.canal" variant="field" :options="channelOptions" :label="data.fields.channel" />
        </div>
        <div>
          <label class="z-label" for="rf-date">{{ data.fields.date }} <span class="rf__opt">{{ data.optional }}</span></label>
          <input id="rf-date" v-model="f.date" class="z-input rf__date" type="date" />
        </div>
      </div>

      <label class="z-label rf__gap" for="rf-link">{{ data.fields.link }} <span class="rf__opt">{{ data.optional }}</span></label>
      <input id="rf-link" v-model="f.lien" class="z-input" type="text" :placeholder="data.fields.linkPlaceholder" aria-describedby="rf-link-hint" />
      <p id="rf-link-hint" class="z-hint">{{ data.fields.linkHint }}</p>

      <div class="rf__row">
        <div>
          <label class="z-label" for="rf-amount">{{ data.fields.amount }} <span class="rf__opt">{{ data.optional }}</span></label>
          <input id="rf-amount" v-model="f.montant" class="z-input num" type="number" min="0" step="1" placeholder="0" />
        </div>
        <div>
          <span class="z-label">{{ data.fields.currency }}</span>
          <ZSelect v-model="f.devise" variant="field" :options="currencyOptions" :label="data.fields.currency" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend class="label">3 — {{ data.sections.evidence }}</legend>
      <div
        class="rf__drop"
        :class="{ 'is-over': dragging }"
        tabindex="0"
        role="button"
        :aria-label="data.files.add"
        aria-describedby="rf-drop-hint"
        @click="fileInput.click()"
        @keydown.enter.prevent="fileInput.click()"
        @keydown.space.prevent="fileInput.click()"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <ZIcon name="upload" :size="26" />
        <strong>{{ data.files.drop }}</strong>
        <span id="rf-drop-hint">{{ t(data.files.hint, { n: MAX_FILES }) }}</span>
      </div>
      <input ref="fileInput" type="file" hidden multiple accept="image/jpeg,image/png,image/webp,application/pdf" @change="onPick" />
      <ul v-if="files.length" class="rf__files">
        <li v-for="(file, i) in files" :key="file.name + file.size">
          <img v-if="previews[i]" class="rf__thumb" :src="previews[i]" alt="" />
          <span v-else class="rf__thumb rf__thumb--pdf"><ZIcon name="file" :size="18" /></span>
          <span class="rf__fmeta"><span class="rf__fname">{{ file.name }}</span><span class="num">{{ size(file.size) }}</span></span>
          <button type="button" :aria-label="t(data.files.remove, { name: file.name })" @click="removeFile(i)"><ZIcon name="close" :size="14" /></button>
        </li>
      </ul>
      <p v-if="fileError" class="z-error" role="alert">{{ fileError }}</p>
      <p v-if="errors.preuves" class="z-error">{{ errors.preuves }}</p>
    </fieldset>

    <fieldset>
      <legend class="label">4 — {{ data.sections.contact }}</legend>
      <div class="rf__row">
        <div>
          <label class="z-label" for="rf-name">{{ data.fields.name }} <span class="rf__opt">{{ data.optional }}</span></label>
          <input id="rf-name" v-model="f.nom" class="z-input" type="text" autocomplete="name" :placeholder="data.fields.namePlaceholder" />
        </div>
        <div>
          <label class="z-label" for="rf-phone">{{ data.fields.phone }} <span class="rf__opt">{{ data.optional }}</span></label>
          <input id="rf-phone" v-model="f.telephone" class="z-input" type="tel" autocomplete="tel" placeholder="+221 …" />
        </div>
      </div>
      <label class="z-label rf__gap" for="rf-email">{{ data.fields.email }}</label>
      <input id="rf-email" v-model="f.email" class="z-input" type="email" autocomplete="email" data-field="email" :placeholder="data.fields.emailPlaceholder" :aria-invalid="!!errors.email" />
      <p v-if="errors.email" class="z-error">{{ errors.email }}</p>

      <div class="rf__hp" aria-hidden="true">
        <label for="rf-site">{{ data.honeypot }}</label>
        <input id="rf-site" v-model="f.site_entreprise" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <div class="rf__captcha">
        <label for="rf-check">{{ data.fields.check }} <strong class="num">{{ q.a }} + {{ q.b }}</strong> ?</label>
        <input id="rf-check" v-model="f.verification" class="z-input num" inputmode="numeric" autocomplete="off" data-field="verification" :aria-invalid="!!errors.verification" />
      </div>
      <p v-if="errors.verification" class="z-error">{{ errors.verification }}</p>

      <label class="rf__consent">
        <input v-model="f.consent" type="checkbox" data-field="consent" :aria-invalid="!!errors.consent" />
        <span class="rf__box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
        <span>{{ data.fields.consent }}</span>
      </label>
      <p v-if="errors.consent" class="z-error">{{ errors.consent }}</p>
    </fieldset>

    <ZButton type="submit" size="lg" class="rf__submit" :disabled="sending">
      <span v-if="sending" class="rf__spin" aria-hidden="true" />
      {{ sending ? data.sending : data.submit }}
    </ZButton>
    <p class="rf__note" role="status">{{ note || data.notes.default }}</p>
  </form>

  <Teleport to="body">
    <div v-if="done" class="rf-ok" role="dialog" aria-modal="true" aria-labelledby="rf-ok-title" @keydown.esc="restart">
      <div class="rf-ok__box">
        <span class="rf-ok__seal" aria-hidden="true">
          <svg viewBox="0 0 78 78"><circle cx="39" cy="39" r="35" /><path d="M25 40.5 35.5 51 54 30" /></svg>
        </span>
        <h2 id="rf-ok-title">{{ data.success.title }}</h2>
        <p>{{ data.success.text }}</p>
        <div class="rf-ok__ticket">
          <span class="label">{{ data.success.reference }}</span>
          <strong class="num">{{ reference }}</strong>
        </div>
        <p v-if="endpoint === '#'" class="rf-ok__demo">{{ data.success.demo }}</p>
        <ZButton ref="againBtn" size="lg" @click="restart">{{ data.success.again }}</ZButton>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rf { padding: 32px; }
fieldset { margin: 0; padding: 0 0 28px; border: 0; }
fieldset + fieldset { padding-top: 28px; border-top: 1px solid var(--color-line-default); }
legend { margin-bottom: 18px; color: var(--color-text-muted); }
.rf__types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.rf__types input { position: absolute; opacity: 0; pointer-events: none; }
.rf__types label { display: grid; gap: 4px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--color-line-strong); background: var(--fill-1); font-size: 14px; font-weight: var(--font-weight-medium); cursor: pointer; transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover); }
.rf__types label:hover { border-color: var(--color-text-dim); }
.rf__types small { font-size: 12px; font-weight: var(--font-weight-regular); color: var(--color-text-muted); }
.rf__types input:checked + label { border-color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 28%, transparent); }
.rf__types input:focus-visible + label { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.rf__area { height: 140px; padding: 12px 14px; resize: vertical; line-height: 1.5; }
.z-hint.is-ok { color: var(--color-state-up); }
.rf__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 18px; }
.rf__gap { margin-top: 18px; }
.rf__opt { color: var(--color-text-dim); }
.rf__date { color-scheme: dark; }
.rf__drop {
  display: grid; justify-items: center; gap: 8px; padding: 32px 20px; border-radius: var(--radius-lg); border: 1px dashed var(--color-line-strong);
  text-align: center; color: var(--color-brand-secondary-300); cursor: pointer; transition: border-color var(--motion-duration-hover), background-color var(--motion-duration-hover);
}
.rf__drop:hover, .rf__drop.is-over { border-color: var(--color-brand-secondary-300); background: color-mix(in srgb, var(--color-brand-secondary) 10%, transparent); }
.rf__drop strong { font-size: 14px; color: var(--color-text-default); }
.rf__drop span { font-size: 12px; color: var(--color-text-muted); }
.rf__files { display: grid; gap: 8px; margin-top: 12px; }
.rf__files li { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); }
.rf__thumb { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; flex: none; }
.rf__thumb--pdf { display: grid; place-items: center; background: var(--fill-2); color: var(--color-brand-primary-300); }
.rf__fmeta { display: grid; flex: 1; min-width: 0; font-size: 12px; color: var(--color-text-muted); }
.rf__fname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--color-text-default); }
.rf__files button { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: var(--color-text-muted); }
.rf__files button:hover { background: var(--fill-2); color: var(--color-text-default); }
.rf__hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.rf__captcha { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 14px; color: var(--color-text-muted); }
.rf__captcha strong { color: var(--color-text-default); }
.rf__captcha .z-input { width: 96px; height: 40px; text-align: center; }
.rf__consent { position: relative; display: flex; gap: 12px; margin-top: 18px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.rf__consent input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.rf__box { display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 5px; border: 1px solid var(--color-text-dim); color: transparent; }
.rf__consent input:checked + .rf__box { background: var(--gradient-brand); border-color: transparent; color: var(--color-text-default); }
.rf__consent input:focus-visible + .rf__box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.rf__consent input[aria-invalid='true'] + .rf__box { border-color: var(--color-state-down); }
.rf__submit { width: 100%; height: 54px; }
.rf__submit:disabled { opacity: 0.6; cursor: progress; }
.rf__spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: rf-spin 0.8s linear infinite; }
@keyframes rf-spin { to { transform: rotate(360deg); } }
.rf__note { margin-top: 12px; font-size: var(--font-size-small); color: var(--color-text-dim); text-align: center; }

.rf-ok { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--color-bg-base) 80%, transparent); backdrop-filter: blur(8px); animation: rf-fade var(--duration-panel) var(--motion-ease-out); }
.rf-ok__box { display: grid; justify-items: center; gap: 12px; width: min(440px, 100%); padding: 36px 28px; border-radius: var(--radius-lg); text-align: center; background: var(--color-bg-surface); border: 1px solid var(--color-line-strong); box-shadow: 0 40px 100px -30px var(--glow-brand); animation: rf-pop var(--motion-duration-reveal) var(--motion-ease-out); }
.rf-ok__seal { width: 78px; height: 78px; color: var(--color-state-up); }
.rf-ok__seal svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.rf-ok__seal circle { stroke-dasharray: 220; stroke-dashoffset: 220; animation: rf-draw 700ms var(--motion-ease-out) forwards; opacity: 0.6; }
.rf-ok__seal path { stroke-dasharray: 48; stroke-dashoffset: 48; animation: rf-draw 450ms var(--motion-ease-out) 450ms forwards; }
.rf-ok__box h2 { font-size: 24px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.rf-ok__box > p { font-size: 14px; color: var(--color-text-muted); }
.rf-ok__ticket { display: grid; gap: 6px; width: 100%; margin: 6px 0; padding: 16px; border-radius: var(--radius-md); border: 1px dashed var(--color-line-strong); background: var(--color-bg-surface-2); }
.rf-ok__ticket .label { color: var(--color-text-dim); }
.rf-ok__ticket strong { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 20px; letter-spacing: 0.04em; }
.rf-ok__demo { font-size: 12px !important; color: var(--color-state-warn) !important; }
@keyframes rf-fade { from { opacity: 0; } }
@keyframes rf-pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
@keyframes rf-draw { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .rf-ok__seal circle, .rf-ok__seal path { stroke-dashoffset: 0; animation: none; } }
@media (max-width: 700px) {
  .rf { padding: 22px; }
  .rf__types, .rf__row { grid-template-columns: 1fr; }
}
</style>
