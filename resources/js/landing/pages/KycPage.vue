<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { kycLevels } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import { useProfile } from '../composables/useProfile.js';
import { toast } from '../composables/useToast.js';
import AccountLayout from '../components/account/AccountLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZFileDrop from '../components/ui/ZFileDrop.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZSelect from '../components/ui/ZSelect.vue';

const { i18n, fmt, t } = useI18n();
const { profile, save } = useProfile();
const data = computed(() => i18n.content.pages.kyc);
const common = computed(() => i18n.content.common);

// ---------- Parcours vers le niveau 2 (4 étapes) ----------
const STEPS = ['address', 'proof', 'selfie', 'review'];
const step = ref(0);
const form = reactive({ country: profile.country, city: profile.city, address: profile.address, proofType: 'utility', proof: null, selfie: null, consent: false });
const errors = reactive({});
const heading = ref(null);
const countryOptions = computed(() => common.value.countries.map((c) => ({ value: c.id, label: c.name })));
const proofOptions = computed(() => Object.entries(data.value.wizard.proofTypes).map(([value, label]) => ({ value, label })));
const countryName = computed(() => common.value.countries.find((c) => c.id === form.country)?.name);

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = data.value.errors;
  if (step.value === 0) {
    if (form.city.trim().length < 2) errors.city = e.city;
    if (form.address.trim().length < 5) errors.address = e.address;
  }
  if (step.value === 1 && !form.proof) errors.proof = e.file;
  if (step.value === 2 && !form.selfie) errors.selfie = e.file;
  if (step.value === 3 && !form.consent) errors.consent = e.consent;
  return !Object.keys(errors).length;
}
async function go(n) {
  step.value = n;
  await nextTick();
  heading.value?.focus();
}
async function next() {
  if (!validate()) return;
  if (step.value < STEPS.length - 1) return go(step.value + 1);
  // DÉMO — en production : envoi multipart vers links.kycAction, puis statut renvoyé par le serveur.
  save({ kyc: { ...profile.kyc, pending: true }, city: form.city, address: form.address, country: form.country });
  toast(data.value.toasts.sent, { tone: 'success' });
}
function resetDemo() {
  save({ kyc: { ...profile.kyc, pending: false } });
  Object.assign(form, { proof: null, selfie: null, consent: false });
  step.value = 0;
}
const limit = (v) => (v ? fmt.xof(v) : '—');
</script>

<template>
  <AccountLayout page="kyc" :title="data.title">
    <section class="ky__status z-panel" :class="{ 'is-pending': profile.kyc.pending }" aria-labelledby="ky-status">
      <span class="ky__badge"><ZIcon :name="profile.kyc.pending ? 'clock' : profile.kyc.level ? 'badge' : 'alert'" :size="22" /></span>
      <div>
        <h2 id="ky-status">{{ t(data.status.level, { n: profile.kyc.level }) }}</h2>
        <p>{{ profile.kyc.pending ? data.status.pending : profile.kyc.level >= 2 ? data.status.max : data.status.next }}</p>
        <p v-if="profile.kyc.level >= 1" class="ky__doc"><ZIcon name="id" :size="14" /> {{ t(data.status.document, { doc: profile.kyc.document }) }}</p>
      </div>
    </section>

    <section class="ky__levels" aria-labelledby="ky-levels">
      <h2 id="ky-levels" class="ky__h">{{ data.levels.title }}</h2>
      <ol class="ky__grid">
        <li v-for="lv in kycLevels" :key="lv.level" class="ky__level z-panel" :class="{ 'is-current': lv.level === profile.kyc.level, 'is-done': lv.level < profile.kyc.level }">
          <div class="ky__lv-head">
            <span class="label">{{ t(data.levels.level, { n: lv.level }) }}</span>
            <span v-if="lv.level === profile.kyc.level" class="ky__tag">{{ data.levels.current }}</span>
            <span v-else-if="lv.level < profile.kyc.level" class="ky__tag is-done"><ZIcon name="check" :size="12" /> {{ data.levels.done }}</span>
          </div>
          <h3>{{ data.levels.items[lv.level].title }}</h3>
          <p>{{ data.levels.items[lv.level].text }}</p>
          <ul>
            <li v-for="r in data.levels.items[lv.level].requires" :key="r"><ZIcon name="check" :size="13" /> {{ r }}</li>
          </ul>
          <dl class="num">
            <div><dt>{{ data.levels.buy }}</dt><dd>{{ limit(lv.buy) }}</dd></div>
            <div><dt>{{ data.levels.withdraw }}</dt><dd>{{ limit(lv.withdraw) }}</dd></div>
          </dl>
        </li>
      </ol>
      <p class="ky__note">{{ data.levels.note }}</p>
    </section>

    <section v-if="profile.kyc.level < 2" class="ky__wizard z-panel" aria-labelledby="ky-wz">
      <template v-if="profile.kyc.pending">
        <div class="ky__pending">
          <span class="ky__badge"><ZIcon name="clock" :size="24" /></span>
          <h2 id="ky-wz">{{ data.pending.title }}</h2>
          <p>{{ data.pending.text }}</p>
          <button type="button" class="ky__reset" @click="resetDemo">{{ data.pending.reset }}</button>
        </div>
      </template>
      <template v-else>
        <h2 id="ky-wz" class="ky__h">{{ data.wizard.title }}</h2>
        <ol class="ky__steps" :aria-label="data.wizard.progress">
          <li v-for="(s, i) in STEPS" :key="s" :class="{ 'is-done': i < step, 'is-active': i === step }" :aria-current="i === step ? 'step' : undefined">
            <span class="num">{{ i < step ? '✓' : i + 1 }}</span> {{ data.wizard.steps[s] }}
          </li>
        </ol>

        <form class="ky__form" novalidate @submit.prevent="next">
          <h3 ref="heading" tabindex="-1">{{ data.wizard.steps[STEPS[step]] }}</h3>

          <template v-if="step === 0">
            <div class="ky__fields">
              <div>
                <span class="z-label">{{ data.wizard.country }}</span>
                <ZSelect v-model="form.country" variant="field" :options="countryOptions" :label="data.wizard.country" />
              </div>
              <div>
                <label class="z-label" for="ky-city">{{ data.wizard.city }}</label>
                <input id="ky-city" v-model="form.city" class="z-input" autocomplete="address-level2" :aria-invalid="!!errors.city" />
                <p v-if="errors.city" class="z-error">{{ errors.city }}</p>
              </div>
              <div class="ky__wide">
                <label class="z-label" for="ky-addr">{{ data.wizard.address }}</label>
                <input id="ky-addr" v-model="form.address" class="z-input" autocomplete="street-address" :placeholder="data.wizard.addressPlaceholder" :aria-invalid="!!errors.address" />
                <p v-if="errors.address" class="z-error">{{ errors.address }}</p>
              </div>
            </div>
          </template>

          <template v-else-if="step === 1">
            <span class="z-label">{{ data.wizard.proofType }}</span>
            <ZSelect v-model="form.proofType" variant="field" :options="proofOptions" :label="data.wizard.proofType" />
            <ul class="ky__rules">
              <li v-for="r in data.wizard.proofRules" :key="r"><ZIcon name="check" :size="13" /> {{ r }}</li>
            </ul>
            <ZFileDrop v-model="form.proof" :label="data.wizard.upload" :hint="data.wizard.uploadHint" :errors="data.fileErrors" :remove="data.wizard.remove" :invalid="!!errors.proof" />
            <p v-if="errors.proof" class="z-error">{{ errors.proof }}</p>
          </template>

          <template v-else-if="step === 2">
            <ul class="ky__rules">
              <li v-for="r in data.wizard.selfieRules" :key="r"><ZIcon name="check" :size="13" /> {{ r }}</li>
            </ul>
            <ZFileDrop v-model="form.selfie" accept="image/jpeg,image/png,image/webp" capture="user" :label="data.wizard.selfie" :hint="data.wizard.selfieHint" :errors="data.fileErrors" :remove="data.wizard.remove" :invalid="!!errors.selfie" />
            <p v-if="errors.selfie" class="z-error">{{ errors.selfie }}</p>
          </template>

          <template v-else>
            <dl class="ky__review">
              <div><dt>{{ data.wizard.address }}</dt><dd>{{ form.address }}, {{ form.city }}, {{ countryName }}</dd></div>
              <div><dt>{{ data.wizard.proofType }}</dt><dd>{{ data.wizard.proofTypes[form.proofType] }} — {{ form.proof?.name }}</dd></div>
              <div><dt>{{ data.wizard.steps.selfie }}</dt><dd>{{ form.selfie?.name }}</dd></div>
            </dl>
            <label class="ky__consent">
              <input v-model="form.consent" type="checkbox" :aria-invalid="!!errors.consent" />
              <span class="ky__box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
              <span>{{ data.wizard.consent }}</span>
            </label>
            <p v-if="errors.consent" class="z-error">{{ errors.consent }}</p>
          </template>

          <div class="ky__nav">
            <ZButton v-if="step > 0" variant="ghost" @click="go(step - 1)"><ZIcon name="arrow-left" :size="14" /> {{ data.wizard.back }}</ZButton>
            <ZButton type="submit">{{ step === STEPS.length - 1 ? data.wizard.submit : data.wizard.next }}</ZButton>
          </div>
        </form>
        <p class="ky__privacy"><ZIcon name="lock" :size="13" /> {{ data.wizard.privacy }}</p>
      </template>
    </section>
  </AccountLayout>
</template>

<style scoped>
.ky__status { display: flex; gap: 18px; align-items: center; margin-top: 28px; padding: 24px; border-color: color-mix(in srgb, var(--color-state-up) 30%, transparent); background: color-mix(in srgb, var(--color-state-up) 6%, var(--color-bg-surface)); }
.ky__status.is-pending { border-color: color-mix(in srgb, var(--color-brand-secondary-300) 35%, transparent); background: color-mix(in srgb, var(--color-brand-secondary) 10%, var(--color-bg-surface)); }
.ky__badge { display: grid; place-items: center; flex: none; width: 52px; height: 52px; border-radius: 50%; background: var(--fill-2); color: var(--color-state-up); }
.is-pending .ky__badge, .ky__pending .ky__badge { color: var(--color-brand-secondary-300); }
.ky__status h2 { font-size: 17px; font-weight: var(--font-weight-semibold); }
.ky__status p { margin-top: 4px; font-size: 13px; color: var(--color-text-muted); }
.ky__doc { display: inline-flex; align-items: center; gap: 6px; }
.ky__h { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.ky__levels { margin-top: 40px; }
.ky__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
.ky__level { display: flex; flex-direction: column; padding: 20px; }
.ky__level.is-current { border-color: color-mix(in srgb, var(--color-brand-primary-300) 45%, transparent); background: color-mix(in srgb, var(--color-brand-primary) 14%, var(--color-bg-surface)); }
.ky__lv-head { display: flex; justify-content: space-between; align-items: center; }
.ky__lv-head .label { color: var(--color-text-dim); }
.ky__tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-sm); font-size: 11px; color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.ky__tag.is-done { color: var(--color-state-up); background: color-mix(in srgb, var(--color-state-up) 14%, transparent); }
.ky__level h3 { margin-top: 12px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.ky__level > p { margin-top: 4px; font-size: 13px; color: var(--color-text-muted); }
.ky__level ul { display: grid; gap: 6px; margin: 14px 0; font-size: 13px; }
.ky__level li { display: flex; gap: 8px; }
.ky__level li :deep(svg) { flex: none; margin-top: 3px; color: var(--color-brand-primary-300); }
.ky__level dl { display: grid; gap: 8px; margin: auto 0 0; padding-top: 14px; border-top: 1px solid var(--color-line-default); font-size: 13px; }
.ky__level dl div { display: flex; justify-content: space-between; gap: 12px; }
.ky__level dt { color: var(--color-text-muted); }
.ky__level dd { margin: 0; font-weight: var(--font-weight-semibold); }
.ky__note { margin-top: 10px; font-size: 12px; color: var(--color-text-dim); }
.ky__wizard { margin-top: 40px; padding: 28px; max-width: 760px; }
.ky__steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 20px 0 28px; }
.ky__steps li { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 2px solid var(--color-line-default); font-size: 12.5px; color: var(--color-text-dim); }
.ky__steps li span { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--color-line-strong); font-size: 11px; }
.ky__steps li.is-active { color: var(--color-text-default); border-color: var(--color-brand-primary-300); }
.ky__steps li.is-active span { background: var(--gradient-brand); border-color: transparent;  color: var(--color-on-brand); }
.ky__steps li.is-done { color: var(--color-text-muted); border-color: var(--color-brand-primary-300); }
.ky__steps li.is-done span { color: var(--color-state-up); border-color: var(--color-state-up); }
.ky__form { display: grid; gap: 12px; }
.ky__form h3 { font-size: 17px; font-weight: var(--font-weight-semibold); }
.ky__form h3:focus { outline: none; }
.ky__fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ky__wide { grid-column: 1 / -1; }
.ky__rules { display: grid; gap: 6px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 13px; color: var(--color-text-muted); }
.ky__rules li { display: flex; gap: 8px; }
.ky__rules :deep(svg) { flex: none; margin-top: 3px; color: var(--color-state-up); }
.ky__review { display: grid; gap: 12px; margin: 0; padding: 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); font-size: 14px; }
.ky__review dt { font-size: 12px; color: var(--color-text-dim); }
.ky__review dd { margin: 2px 0 0; overflow-wrap: anywhere; }
.ky__consent { position: relative; display: flex; gap: 12px; margin-top: 6px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.ky__consent input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.ky__box { display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 5px; border: 1px solid var(--color-text-dim); color: transparent; }
.ky__consent input:checked + .ky__box { background: var(--gradient-brand); border-color: transparent; color: var(--color-on-brand); }
.ky__consent input:focus-visible + .ky__box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.ky__consent input[aria-invalid='true'] + .ky__box { border-color: var(--color-state-down); }
.ky__nav { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
.ky__privacy { display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 12px; color: var(--color-text-dim); }
.ky__pending { display: grid; justify-items: center; gap: 10px; padding: 20px 0; text-align: center; }
.ky__pending h2 { font-size: 20px; font-weight: var(--font-weight-semibold); }
.ky__pending p { max-width: 50ch; font-size: 14px; color: var(--color-text-muted); }
.ky__reset { font-size: 12.5px; color: var(--color-text-dim); text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 900px) {
  .ky__grid { grid-template-columns: 1fr; }
  .ky__steps { grid-template-columns: 1fr 1fr; }
  .ky__fields { grid-template-columns: 1fr; }
  .ky__wizard { padding: 20px; }
}
</style>
