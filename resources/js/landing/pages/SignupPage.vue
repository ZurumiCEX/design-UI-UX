<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import AuthProviders from '../components/auth/AuthProviders.vue';
import AuthVisual from '../components/auth/AuthVisual.vue';
import IdentifierField from '../components/auth/IdentifierField.vue';
import OtpInput from '../components/auth/OtpInput.vue';
import PasswordField from '../components/auth/PasswordField.vue';
import { identifierFromUrl, passwordRules, validateIdentifier } from '../components/auth/validate.js';
import AuthShell from '../components/layout/AuthShell.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';

const { i18n, t, parts } = useI18n();
const data = computed(() => i18n.content.pages.signup);
const auth = computed(() => i18n.content.auth);
const common = computed(() => i18n.content.common);

// 1 : identifiant + conditions · 2 : code de vérification · 3 : mot de passe · 4 : terminé
const TOTAL = 3;
const step = ref(1);
const id = reactive({ method: 'email', email: '', phone: '', country: i18n.content.common.defaultCountry, ...identifierFromUrl() });
const terms = ref(false);
const code = ref('');
const password = ref('');
const confirm = ref('');
const errors = reactive({ id: '', terms: '', code: '', password: '', confirm: '' });
const notice = ref('');
const heading = ref(null);
const idField = ref(null);
const otp = ref(null);
const pwField = ref(null);

const country = computed(() => common.value.countries.find((c) => c.id === id.country));
const target = computed(() => (id.method === 'email' ? id.email.trim() : `${country.value?.dial} ${id.phone}`));
const rules = computed(() => passwordRules(password.value));
const rulesOk = computed(() => Object.values(rules.value).every(Boolean));
// Les erreurs disparaissent dès que la saisie redevient valide.
watch(rulesOk, (ok) => ok && (errors.password = ''));
watch(confirm, () => (errors.confirm = ''));
watch(terms, (v) => v && (errors.terms = ''));

// Renvoi du code : 60 s d'attente.
const cooldown = ref(0);
let timer = 0;
function startCooldown() {
  cooldown.value = 60;
  clearInterval(timer);
  timer = setInterval(() => {
    if (--cooldown.value <= 0) clearInterval(timer);
  }, 1000);
}
function resend() {
  startCooldown();
  notice.value = data.value.verify.resent;
}
onBeforeUnmount(() => clearInterval(timer));

async function go(n) {
  step.value = n;
  notice.value = '';
  await nextTick();
  if (n === 1) idField.value?.focus();
  else if (n === 2) otp.value?.focus();
  else if (n === 3) pwField.value?.focus();
  else heading.value?.focus();
}

function onSubmit(e) {
  if (step.value === 1) {
    errors.id = validateIdentifier(id);
    errors.terms = terms.value ? '' : data.value.errors.terms;
    if (errors.id) idField.value?.focus();
    if (errors.id || errors.terms) return e.preventDefault();
    e.preventDefault();
    startCooldown();
    return go(2);
  }
  if (step.value === 2) {
    e.preventDefault();
    errors.code = code.value.length === 6 ? '' : data.value.errors.code;
    if (errors.code) return otp.value?.focus();
    return go(3);
  }
  // Étape 3 : création du compte.
  errors.password = rulesOk.value ? '' : data.value.errors.password;
  errors.confirm = !errors.password && confirm.value !== password.value ? data.value.errors.confirm : '';
  if (errors.password || errors.confirm) {
    e.preventDefault();
    return pwField.value?.focus();
  }
  // Route serveur à brancher : sans elle, on affiche l'écran final de démo.
  if (common.value.links.signupAction === '#') {
    e.preventDefault();
    go(4);
  }
}
</script>

<template>
  <AuthShell>
    <template #visual><AuthVisual :data="data.visual" variant="perks" /></template>

    <template v-if="step <= TOTAL">
      <div class="head">
        <h1 ref="heading" class="auth-title" tabindex="-1">{{ step === 1 ? data.title : step === 2 ? t(data.verify.title, { method: data.verify.methods[id.method] }) : data.password.title }}</h1>
        <span class="head__step label">{{ t(data.step, { n: step, total: TOTAL }) }}</span>
      </div>
      <div class="progress" role="progressbar" :aria-label="data.progress" aria-valuemin="1" :aria-valuemax="TOTAL" :aria-valuenow="step">
        <span :style="{ transform: `scaleX(${step / TOTAL})` }" />
      </div>

      <form :action="common.links.signupAction" method="post" novalidate @submit="onSubmit">
        <input type="hidden" name="identifier" :value="target" />

        <!-- Étape 1 -->
        <template v-if="step === 1">
          <IdentifierField
            ref="idField"
            v-model:method="id.method"
            v-model:email="id.email"
            v-model:phone="id.phone"
            v-model:country="id.country"
            :data="auth.identifier"
            :countries="common.countries"
            :error="errors.id"
            id-prefix="signup"
          />
          <label class="terms">
            <input v-model="terms" type="checkbox" name="terms" :aria-invalid="!!errors.terms" :aria-describedby="errors.terms ? 'terms-error' : undefined" />
            <span class="terms__box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
            <span>
              <template v-for="(p, i) in parts(data.terms)" :key="i">
                <a v-if="p.slot === 'terms'" :href="common.links.terms">{{ data.termsLink }}</a>
                <a v-else-if="p.slot === 'privacy'" :href="common.links.privacy">{{ data.privacyLink }}</a>
                <template v-else>{{ p.text }}</template>
              </template>
            </span>
          </label>
          <p v-if="errors.terms" id="terms-error" class="z-error">{{ errors.terms }}</p>
          <ZButton type="submit" size="lg" class="auth-cta">{{ data.continue }}</ZButton>
        </template>

        <!-- Étape 2 -->
        <template v-else-if="step === 2">
          <p id="otp-text" class="lead">{{ t(data.verify.text, { target }) }}</p>
          <OtpInput ref="otp" v-model="code" :label="data.verify.label" :digit-label="data.verify.digit" :invalid="!!errors.code" describedby="otp-text" />
          <p v-if="errors.code" class="z-error" role="alert">{{ errors.code }}</p>
          <button type="button" class="link-btn" :disabled="cooldown > 0" @click="resend">
            {{ cooldown > 0 ? t(data.verify.resendIn, { s: cooldown }) : data.verify.resend }}
          </button>
          <ZButton type="submit" size="lg" class="auth-cta">{{ data.verify.submit }}</ZButton>
          <button type="button" class="back" @click="go(1)"><ZIcon name="arrow-left" :size="14" /> {{ data.back }}</button>
        </template>

        <!-- Étape 3 -->
        <template v-else>
          <PasswordField
            id="signup-password"
            ref="pwField"
            v-model="password"
            :label="auth.password.label"
            :labels="auth.password"
            autocomplete="new-password"
            :error="errors.password"
            describedby="pw-rules"
          />
          <ul id="pw-rules" class="rules" :aria-label="data.password.rulesLabel">
            <li v-for="(label, key) in data.password.rules" :key="key" :class="{ 'is-ok': rules[key] }">
              <ZIcon :name="rules[key] ? 'check' : 'minus'" :size="14" /> {{ label }}
            </li>
          </ul>
          <PasswordField
            id="signup-confirm"
            v-model="confirm"
            :label="data.password.confirm"
            :labels="auth.password"
            autocomplete="new-password"
            :error="errors.confirm"
          />
          <ZButton type="submit" size="lg" class="auth-cta">{{ data.password.submit }}</ZButton>
          <button type="button" class="back" @click="go(2)"><ZIcon name="arrow-left" :size="14" /> {{ data.back }}</button>
        </template>

        <p v-if="notice" class="z-notice auth-notice" role="status">{{ notice }}</p>
      </form>

      <AuthProviders v-if="step === 1" :data="auth" />
      <p class="auth-switch">
        {{ data.hasAccount }} <a :href="common.links.login">{{ data.login }}</a>
      </p>
    </template>

    <!-- Terminé -->
    <div v-else class="done">
      <span class="done__icon" aria-hidden="true"><ZIcon name="check" :size="28" /></span>
      <h1 ref="heading" class="auth-title" tabindex="-1">{{ data.done.title }}</h1>
      <p class="lead">{{ data.done.text }}</p>
      <ZButton size="lg" class="auth-cta" :href="common.links.quickBuy">{{ data.done.cta }}</ZButton>
      <p class="z-notice auth-notice">{{ auth.demo }}</p>
    </div>
  </AuthShell>
</template>

<style scoped>
.head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 14px; }
.auth-title { font-size: clamp(30px, 3vw, 38px); font-weight: var(--font-weight-semibold); letter-spacing: -0.035em; line-height: 1.05; }
.auth-title:focus { outline: none; }
.head__step { color: var(--color-text-dim); }
.progress { height: 2px; margin: 20px 0 28px; border-radius: 2px; background: var(--color-line-default); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--gradient-brand-soft); transform-origin: 0 50%; transition: transform var(--duration-rule) var(--motion-ease-out); }
.lead { margin-bottom: 20px; font-size: 14px; color: var(--color-text-muted); overflow-wrap: anywhere; }

.terms { position: relative; display: flex; gap: 12px; margin-top: 22px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.terms input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.terms__box {
  display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 5px;
  border: 1px solid var(--color-text-dim); color: transparent; transition: background-color var(--motion-duration-hover), border-color var(--motion-duration-hover);
}
.terms input:checked + .terms__box { background: var(--gradient-brand); border-color: transparent; color: var(--color-on-brand); }
.terms input:focus-visible + .terms__box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.terms input[aria-invalid='true'] + .terms__box { border-color: var(--color-state-down); }
.terms a { color: var(--color-text-default); text-decoration: underline; text-underline-offset: 3px; }

.rules { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin: 12px 0 20px; font-size: var(--font-size-small); color: var(--color-text-dim); }
.rules li { display: flex; align-items: center; gap: 6px; transition: color var(--motion-duration-hover); }
.rules li.is-ok { color: var(--color-state-up); }

.auth-cta { width: 100%; height: 50px; margin-top: 24px; font-size: 12px; }
.auth-notice { margin-top: 14px; }
.link-btn { margin-top: 14px; font-size: 13px; color: var(--color-brand-primary-300); }
.link-btn:disabled { color: var(--color-text-dim); cursor: default; }
.back { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 13px; color: var(--color-text-muted); }
.back:hover { color: var(--color-text-default); }
.auth-switch { margin-top: 28px; font-size: 13px; color: var(--color-text-muted); }
.auth-switch a { color: var(--color-text-default); font-weight: var(--font-weight-semibold); text-decoration: underline; text-underline-offset: 3px; }

.done { text-align: center; }
.done__icon { display: inline-grid; place-items: center; width: 64px; height: 64px; margin-bottom: 24px; border-radius: 50%; background: var(--gradient-brand); box-shadow: 0 0 60px -10px var(--glow-brand);  color: var(--color-on-brand); }
.done .lead { margin-top: 12px; }
</style>
