<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { PHASE_COUNT, VERIFY_STATE } from '../../verify/states.js';
import { VERIFICATION_TYPES } from '../../verify/types.js';
import { useTurnstile } from '../../verify/useTurnstile.js';
import { useVerification } from '../../verify/useVerification.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZSelect from '../ui/ZSelect.vue';
import VerifySeal from './VerifySeal.vue';

// Carte de vérification : formulaire → chargement → résultat (« certificat »).
const props = defineProps({
  data: { type: Object, required: true }, // pages.verify
  links: { type: Object, required: true },
});
const { i18n, fmt } = useI18n();

const turnstileEl = ref(null);
const input = ref(null);
const { getToken } = useTurnstile(turnstileEl, i18n.locale);
const v = useVerification();
const { state, typeId, query, fieldError, serviceError, result, phaseIndex, isBusy, canSubmit, preset } = v;

const type = computed(() => props.data.types[typeId.value]);
const options = computed(() =>
  VERIFICATION_TYPES.map((tp) => ({
    value: tp.id,
    label: props.data.types[tp.id].label,
    description: props.data.types[tp.id].description,
    icon: tp.icon,
    group: props.data.groups[tp.group],
  })),
);
const showForm = computed(() => state.value === VERIFY_STATE.IDLE || state.value === VERIFY_STATE.VALIDATING);
const showLoading = computed(() => state.value === VERIFY_STATE.CHECKING);
const copy = computed(() => props.data.results[state.value]);
const phaseLabel = computed(() => props.data.phases[phaseIndex.value] ?? props.data.phases[0]);
const errorText = computed(() => (fieldError.value ? props.data.errors[fieldError.value] : ''));
const label = computed(() => (result.value?.label ? props.data.labels[result.value.label] ?? result.value.label : ''));

const rows = computed(() => {
  if (!result.value) return [];
  const r = props.data.certificate;
  const date = result.value.verifiedAt
    ? `${fmt.date(new Date(result.value.verifiedAt), { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' })} UTC`
    : '—';
  return [
    { label: r.type, value: props.data.types[result.value.type]?.label ?? '—' },
    { label: r.value, value: result.value.value, mono: true },
    { label: r.status, value: props.data.statusLabels[state.value] ?? '—' },
    { label: r.checked, value: date },
  ];
});

// Annonce unique de chaque changement d'état aux lecteurs d'écran.
const live = computed(() => {
  if (showLoading.value) return phaseLabel.value;
  if (errorText.value) return errorText.value;
  if (copy.value) return `${copy.value.title}. ${message.value}`;
  return '';
});
const message = computed(() => (serviceError.value ? props.data.serviceErrors[serviceError.value] ?? props.data.serviceErrors.unknown : copy.value?.message));

async function onSubmit() {
  await v.submit({ turnstileToken: await getToken() });
  if (fieldError.value) input.value?.focus();
}
function onAction(action) {
  if (action === 'report') return window.location.assign(props.links.report);
  if (action === 'support') return window.location.assign(props.links.support);
  if (action === 'retry') return onSubmit();
  v.reset();
  requestAnimationFrame(() => input.value?.focus());
}
function tryExample() {
  v.selectType('email');
  query.value = `support${String.fromCharCode(64)}zurumi.com`; // jamais en clair dans le code servi
}
onBeforeUnmount(v.dispose);
</script>

<template>
  <div class="vc-wrap">
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ live }}</p>

    <div class="vc z-panel" :class="{ 'is-verified': state === 'verified' }">
      <Transition name="vc" mode="out-in">
        <form v-if="showForm" key="form" class="vc__form" novalidate @submit.prevent="onSubmit">
          <div class="vc__fields">
            <div>
              <span class="vc__label label">{{ data.form.type }}</span>
              <ZSelect :model-value="typeId" variant="field" class="vc__type" :options="options" :label="data.form.type" @update:model-value="v.selectType" />
            </div>
            <div class="vc__value">
              <label class="vc__label label" for="vc-input">{{ data.form.value }}</label>
              <div class="vc__input" :class="{ 'is-invalid': errorText }">
                <ZIcon name="search" :size="18" />
                <input
                  id="vc-input"
                  ref="input"
                  v-model="query"
                  type="text"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck="false"
                  :inputmode="VERIFICATION_TYPES.find((tp) => tp.id === typeId).inputMode"
                  :placeholder="type.placeholder"
                  :disabled="isBusy"
                  :aria-invalid="!!errorText"
                  :aria-describedby="errorText ? 'vc-error' : 'vc-hint'"
                />
                <button v-if="query && !isBusy" type="button" class="vc__clear" :aria-label="data.form.clear" @click="query = ''; input?.focus()"><ZIcon name="close" :size="15" /></button>
              </div>
              <p v-if="errorText" id="vc-error" class="z-error">{{ errorText }}</p>
              <p v-else id="vc-hint" class="z-hint">{{ type.hint }}</p>
            </div>
          </div>

          <ZButton type="submit" size="lg" class="vc__submit" :disabled="!canSubmit"><ZIcon name="shield" :size="16" /> {{ data.form.submit }}</ZButton>
          <div ref="turnstileEl" />

          <div class="vc__warning" role="note">
            <ZIcon name="lock" :size="17" />
            <p><strong>{{ data.warning.strong }}</strong> {{ data.warning.text }}</p>
          </div>
        </form>

        <div v-else-if="showLoading" key="loading" class="vc__loading">
          <VerifySeal tone="scanning" icon="shield" :size="96" />
          <p aria-hidden="true">{{ phaseLabel }}</p>
          <ol aria-hidden="true">
            <li v-for="i in PHASE_COUNT" :key="i" :class="{ 'is-on': i - 1 <= phaseIndex }" />
          </ol>
        </div>

        <section v-else-if="copy" key="result" class="vc__result" :class="`is-${preset.tone}`" aria-labelledby="vc-result-title">
          <VerifySeal :tone="preset.tone" :icon="preset.icon" :size="112" />
          <p class="vc__badge label"><ZIcon v-if="preset.tone === 'verified'" name="check" :size="12" /> {{ copy.badge }}</p>
          <h2 id="vc-result-title" class="vc__title">{{ copy.title }}</h2>
          <p class="vc__message">{{ message }}</p>
          <p v-if="label" class="vc__match">{{ label }}</p>

          <dl v-if="rows.length" class="vc__cert">
            <div v-for="row in rows" :key="row.label">
              <dt class="label">{{ row.label }}</dt>
              <dd :class="{ 'is-mono': row.mono }">{{ row.value }}</dd>
            </div>
          </dl>

          <p v-if="copy.notice" class="vc__notice" role="alert"><ZIcon name="alert" :size="16" /> <span>{{ copy.notice }}</span></p>

          <div class="vc__actions">
            <ZButton @click="onAction(preset.primary)">{{ data.actions[preset.primary] }}</ZButton>
            <ZButton variant="ghost" @click="onAction(preset.secondary)"><ZIcon v-if="preset.secondary === 'report'" name="flag" :size="14" /> {{ data.actions[preset.secondary] }}</ZButton>
          </div>
        </section>
      </Transition>
    </div>

    <p v-if="showForm" class="vc__example">
      {{ data.form.example }} <button type="button" @click="tryExample">support[a]zurumi.com</button>
    </p>
  </div>
</template>

<style scoped>
.vc { position: relative; overflow: hidden; box-shadow: 0 40px 100px -50px var(--glow-brand); transition: box-shadow var(--duration-rule); }
.vc.is-verified { box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-brand-primary-300) 35%, transparent), 0 40px 100px -40px var(--glow-brand); }
.vc__form { padding: 28px; }
.vc__fields { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 16px; align-items: start; }
.vc__label { display: block; margin-bottom: 8px; color: var(--color-text-dim); }
.vc__type :deep(.zs__btn) { height: auto; min-height: 52px; padding-block: 8px; }
.vc__type :deep(.zs__panel) { width: max(100%, 320px); }
.vc__input { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 12px 0 14px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-strong); color: var(--color-text-dim); transition: border-color var(--motion-duration-hover); }
.vc__input:focus-within { border-color: var(--color-brand-secondary-300); }
.vc__input.is-invalid { border-color: var(--color-state-down); }
.vc__input input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; font-size: 15px; color: var(--color-text-default); }
.vc__input input::placeholder { color: var(--color-text-dim); }
.vc__clear { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius-sm); }
.vc__clear:hover { color: var(--color-text-default); background: var(--fill-2); }
.vc__submit { width: 100%; height: 52px; margin-top: 20px; }
.vc__submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.vc__warning { display: flex; gap: 12px; margin-top: 20px; padding: 14px 16px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-brand-primary) 14%, transparent); border: 1px solid color-mix(in srgb, var(--color-brand-primary-300) 22%, transparent); font-size: 13px; color: var(--color-text-muted); }
.vc__warning :deep(svg) { flex: none; margin-top: 1px; color: var(--color-brand-primary-300); }
.vc__warning strong { color: var(--color-text-default); font-weight: var(--font-weight-semibold); }
.vc__loading { display: grid; justify-items: center; gap: 18px; padding: 56px 24px; text-align: center; font-size: 14px; }
.vc__loading ol { display: flex; gap: 6px; }
.vc__loading li { width: 16px; height: 3px; border-radius: 2px; background: var(--color-line-strong); transition: width 300ms, background-color 300ms; }
.vc__loading li.is-on { width: 32px; background: var(--color-brand-primary-300); }
.vc__result { --tone: var(--color-brand-primary-300); display: grid; justify-items: center; padding: 40px 28px; text-align: center; }
.vc__result.is-neutral { --tone: var(--color-brand-secondary-300); }
.vc__result.is-warning { --tone: var(--color-state-warn); }
.vc__result.is-danger { --tone: var(--color-state-down); }
.vc__badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 24px; padding: 5px 12px; border-radius: var(--radius-pill); color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent); border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent); }
.vc__title { margin-top: 14px; font-size: clamp(28px, 3.4vw, 38px); font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; }
.vc__message { max-width: 44ch; margin-top: 10px; font-size: 14px; color: var(--color-text-muted); }
.vc__match { margin-top: 10px; font-size: 14px; font-weight: var(--font-weight-medium); color: var(--tone); }
.vc__cert { width: min(520px, 100%); margin: 26px 0 0; border-radius: var(--radius-lg); border: 1px solid var(--color-line-default); background: color-mix(in srgb, var(--color-bg-base) 50%, transparent); text-align: left; }
.vc__cert div { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; padding: 12px 16px; }
.vc__cert div + div { border-top: 1px solid var(--color-line-default); }
.vc__cert dt { flex: none; color: var(--color-text-dim); }
.vc__cert dd { margin: 0; min-width: 0; font-size: 14px; text-align: right; overflow-wrap: anywhere; }
.vc__cert .is-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; }
.vc__notice { display: flex; gap: 10px; width: min(520px, 100%); margin-top: 20px; padding: 12px 16px; border-radius: var(--radius-md); text-align: left; font-size: 13px; color: var(--color-text-muted); background: color-mix(in srgb, var(--tone) 8%, transparent); border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent); }
.vc__notice :deep(svg) { flex: none; margin-top: 1px; color: var(--tone); }
.vc__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 28px; }
.vc__example { margin-top: 16px; text-align: center; font-size: 12.5px; color: var(--color-text-dim); }
.vc__example button { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--color-text-muted); text-decoration: underline; text-underline-offset: 4px; }
.vc__example button:hover { color: var(--color-brand-primary-300); }
.vc-enter-active { transition: opacity 340ms ease, transform 340ms cubic-bezier(0.16, 1, 0.3, 1); }
.vc-leave-active { transition: opacity 160ms ease; }
.vc-enter-from { opacity: 0; transform: translateY(10px); }
.vc-leave-to { opacity: 0; }
@media (max-width: 700px) {
  .vc__form { padding: 20px; }
  .vc__fields { grid-template-columns: 1fr; }
  .vc__cert div { flex-direction: column; gap: 4px; }
  .vc__cert dd { text-align: left; }
}
</style>
