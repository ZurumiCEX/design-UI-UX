<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import AuthVisual from '../components/auth/AuthVisual.vue';
import IdentifierField from '../components/auth/IdentifierField.vue';
import OtpInput from '../components/auth/OtpInput.vue';
import PasswordField from '../components/auth/PasswordField.vue';
import { identifierFromUrl, passwordRules, validateIdentifier } from '../components/auth/validate.js';
import AuthShell from '../components/layout/AuthShell.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';

// Mot de passe oublié : identifiant → code reçu → nouveau mot de passe → terminé.
// Le message de l'étape 1 ne révèle jamais si un compte existe.
const { i18n, t } = useI18n();
const data = computed(() => i18n.content.pages.forgot);
const auth = computed(() => i18n.content.auth);
const signup = computed(() => i18n.content.pages.signup);
const common = computed(() => i18n.content.common);

const TOTAL = 3;
const step = ref(1);
const id = reactive({ method: 'email', email: '', phone: '', country: i18n.content.common.defaultCountry, ...identifierFromUrl() });
const code = ref('');
const password = ref('');
const confirm = ref('');
const errors = reactive({ id: '', code: '', password: '', confirm: '' });
const heading = ref(null);
const idField = ref(null);
const otp = ref(null);
const pwField = ref(null);
const country = computed(() => common.value.countries.find((c) => c.id === id.country));
const target = computed(() => (id.method === 'email' ? id.email.trim() : `${country.value?.dial} ${id.phone}`));
const rules = computed(() => passwordRules(password.value));
const rulesOk = computed(() => Object.values(rules.value).every(Boolean));
watch(rulesOk, (ok) => ok && (errors.password = ''));

const cooldown = ref(0);
let timer = 0;
function startCooldown() {
  cooldown.value = 60;
  clearInterval(timer);
  timer = setInterval(() => --cooldown.value <= 0 && clearInterval(timer), 1000);
}
onBeforeUnmount(() => clearInterval(timer));

async function go(n) {
  step.value = n;
  await nextTick();
  (n === 1 ? idField : n === 2 ? otp : n === 3 ? pwField : heading).value?.focus();
}
function onSubmit(e) {
  e.preventDefault();
  if (step.value === 1) {
    errors.id = validateIdentifier(id);
    if (errors.id) return idField.value?.focus();
    startCooldown();
    return go(2);
  }
  if (step.value === 2) {
    errors.code = code.value.length === 6 ? '' : signup.value.errors.code;
    return errors.code ? otp.value?.focus() : go(3);
  }
  errors.password = rulesOk.value ? '' : signup.value.errors.password;
  errors.confirm = !errors.password && confirm.value !== password.value ? signup.value.errors.confirm : '';
  if (errors.password || errors.confirm) return pwField.value?.focus();
  // DÉMO — en production : POST vers links.forgotAction avec le jeton de réinitialisation.
  go(4);
}
</script>

<template>
  <AuthShell>
    <template #visual><AuthVisual :data="data.visual" variant="shield" /></template>

    <template v-if="step <= TOTAL">
      <a class="fg__back" :href="common.links.login"><ZIcon name="arrow-left" :size="14" /> {{ data.backToLogin }}</a>
      <div class="fg__head">
        <h1 ref="heading" class="fg__title" tabindex="-1">{{ data.titles[step - 1] }}</h1>
        <span class="label fg__step">{{ t(signup.step, { n: step, total: TOTAL }) }}</span>
      </div>
      <div class="fg__progress" role="progressbar" :aria-label="data.progress" aria-valuemin="1" :aria-valuemax="TOTAL" :aria-valuenow="step"><span :style="{ transform: `scaleX(${step / TOTAL})` }" /></div>

      <form :action="common.links.forgotAction" method="post" novalidate @submit="onSubmit">
        <template v-if="step === 1">
          <p class="fg__lead">{{ data.intro }}</p>
          <IdentifierField
            ref="idField"
            v-model:method="id.method"
            v-model:email="id.email"
            v-model:phone="id.phone"
            v-model:country="id.country"
            :data="auth.identifier"
            :countries="common.countries"
            :error="errors.id"
            id-prefix="forgot"
          />
          <ZButton type="submit" size="lg" class="fg__cta">{{ data.send }}</ZButton>
        </template>

        <template v-else-if="step === 2">
          <p id="fg-otp" class="fg__lead">{{ t(data.sent, { target }) }}</p>
          <OtpInput ref="otp" v-model="code" :label="signup.verify.label" :digit-label="signup.verify.digit" :invalid="!!errors.code" describedby="fg-otp" />
          <p v-if="errors.code" class="z-error" role="alert">{{ errors.code }}</p>
          <button type="button" class="fg__link" :disabled="cooldown > 0" @click="startCooldown">
            {{ cooldown > 0 ? t(signup.verify.resendIn, { s: cooldown }) : signup.verify.resend }}
          </button>
          <ZButton type="submit" size="lg" class="fg__cta">{{ signup.verify.submit }}</ZButton>
          <button type="button" class="fg__link" @click="go(1)">{{ data.otherId }}</button>
        </template>

        <template v-else>
          <PasswordField id="fg-pw" ref="pwField" v-model="password" :label="data.newPassword" :labels="auth.password" autocomplete="new-password" :error="errors.password" describedby="fg-rules" />
          <ul id="fg-rules" class="fg__rules">
            <li v-for="(label, key) in signup.password.rules" :key="key" :class="{ 'is-ok': rules[key] }"><ZIcon :name="rules[key] ? 'check' : 'minus'" :size="13" /> {{ label }}</li>
          </ul>
          <PasswordField id="fg-confirm" v-model="confirm" :label="signup.password.confirm" :labels="auth.password" autocomplete="new-password" :error="errors.confirm" />
          <p class="z-notice fg__notice">{{ data.notice }}</p>
          <ZButton type="submit" size="lg" class="fg__cta">{{ data.reset }}</ZButton>
        </template>
      </form>
    </template>

    <div v-else class="fg__done">
      <span class="fg__icon" aria-hidden="true"><ZIcon name="check" :size="26" /></span>
      <h1 ref="heading" class="fg__title" tabindex="-1">{{ data.done.title }}</h1>
      <p class="fg__lead">{{ data.done.text }}</p>
      <ZButton size="lg" class="fg__cta" :href="common.links.login">{{ data.done.cta }}</ZButton>
      <p class="z-notice">{{ auth.demo }}</p>
    </div>
  </AuthShell>
</template>

<style scoped>
.fg__back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 24px; font-size: 13px; color: var(--color-text-muted); }
.fg__back:hover { color: var(--color-text-default); }
.fg__head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 14px; }
.fg__title { font-size: clamp(28px, 2.8vw, 36px); font-weight: var(--font-weight-semibold); letter-spacing: -0.035em; line-height: 1.08; }
.fg__title:focus { outline: none; }
.fg__step { color: var(--color-text-dim); }
.fg__progress { height: 2px; margin: 20px 0 24px; border-radius: 2px; background: var(--color-line-default); overflow: hidden; }
.fg__progress span { display: block; height: 100%; background: var(--gradient-brand-soft); transform-origin: 0 50%; transition: transform var(--duration-rule) var(--motion-ease-out); }
.fg__lead { margin-bottom: 20px; font-size: 14px; color: var(--color-text-muted); overflow-wrap: anywhere; }
.fg__cta { width: 100%; height: 50px; margin-top: 22px; font-size: 12px; }
.fg__link { display: block; margin-top: 14px; font-size: 13px; color: var(--color-brand-primary-300); }
.fg__link:disabled { color: var(--color-text-dim); cursor: default; }
.fg__rules { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin: 12px 0 18px; font-size: 12px; color: var(--color-text-dim); }
.fg__rules li { display: flex; align-items: center; gap: 6px; }
.fg__rules li.is-ok { color: var(--color-state-up); }
.fg__notice { margin-top: 16px; }
.fg__done { display: grid; justify-items: center; gap: 4px; text-align: center; }
.fg__done .fg__lead { margin: 10px 0 0; }
.fg__icon { display: grid; place-items: center; width: 64px; height: 64px; margin-bottom: 20px; border-radius: 50%; background: var(--gradient-brand); box-shadow: 0 0 60px -10px var(--glow-brand); }
.fg__done .z-notice { margin-top: 14px; }
</style>
