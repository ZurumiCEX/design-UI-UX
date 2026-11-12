<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import AuthProviders from '../components/auth/AuthProviders.vue';
import AuthVisual from '../components/auth/AuthVisual.vue';
import IdentifierField from '../components/auth/IdentifierField.vue';
import PasswordField from '../components/auth/PasswordField.vue';
import { identifierFromUrl, validateIdentifier } from '../components/auth/validate.js';
import AuthShell from '../components/layout/AuthShell.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';

const { i18n } = useI18n();
const data = computed(() => i18n.content.pages.login);
const auth = computed(() => i18n.content.auth);
const common = computed(() => i18n.content.common);

// Étape 1 : identifiant. Étape 2 : mot de passe.
const step = ref('identifier');
const id = reactive({ method: 'email', email: '', phone: '', country: i18n.content.common.defaultCountry, ...identifierFromUrl() });
const idError = ref('');
const password = ref('');
const pwError = ref('');
const notice = ref('');
const idField = ref(null);
const pwField = ref(null);

const country = computed(() => common.value.countries.find((c) => c.id === id.country));
const display = computed(() => (id.method === 'email' ? id.email.trim() : `${country.value?.dial} ${id.phone}`));

async function next() {
  idError.value = validateIdentifier(id);
  if (idError.value) return idField.value?.focus();
  step.value = 'password';
  await nextTick();
  pwField.value?.focus();
}
async function edit() {
  step.value = 'identifier';
  password.value = '';
  pwError.value = '';
  notice.value = '';
  await nextTick();
  idField.value?.focus();
}
function onSubmit(e) {
  if (step.value === 'identifier') {
    e.preventDefault();
    next();
    return;
  }
  pwError.value = password.value ? '' : data.value.errors.password;
  if (pwError.value) {
    e.preventDefault();
    pwField.value?.focus();
    return;
  }
  // Route serveur à brancher : sans elle, on affiche un message de démo.
  if (common.value.links.loginAction === '#') {
    e.preventDefault();
    notice.value = auth.value.demo;
  }
}
</script>

<template>
  <AuthShell>
    <template #visual><AuthVisual :data="data.visual" variant="shield" /></template>

    <h1 class="auth-title">{{ data.title }}</h1>

    <form :action="common.links.loginAction" method="post" novalidate @submit="onSubmit">
      <input type="hidden" name="identifier" :value="display" />
      <IdentifierField
        v-if="step === 'identifier'"
        ref="idField"
        v-model:method="id.method"
        v-model:email="id.email"
        v-model:phone="id.phone"
        v-model:country="id.country"
        :data="auth.identifier"
        :countries="common.countries"
        :error="idError"
        id-prefix="login"
      />
      <template v-else>
        <div class="who">
          <span class="who__id"><ZIcon :name="id.method === 'email' ? 'mail' : 'phone'" :size="16" /> {{ display }}</span>
          <button type="button" class="who__edit" @click="edit">{{ data.edit }}</button>
        </div>
        <PasswordField
          id="login-password"
          ref="pwField"
          v-model="password"
          :label="auth.password.label"
          :labels="auth.password"
          autocomplete="current-password"
          :error="pwError"
        />
        <a class="forgot" :href="common.links.forgotPassword">{{ data.forgot }}</a>
      </template>

      <ZButton type="submit" size="lg" class="auth-cta">{{ step === 'identifier' ? data.next : data.submit }}</ZButton>
      <p v-if="notice" class="z-notice auth-notice" role="status">{{ notice }}</p>
    </form>

    <AuthProviders :data="auth" />

    <p class="auth-switch">
      {{ data.noAccount }} <a :href="common.links.signup">{{ data.signup }}</a>
    </p>
  </AuthShell>
</template>

<style scoped>
.auth-title { margin-bottom: 28px; font-size: clamp(30px, 3vw, 38px); font-weight: var(--font-weight-semibold); letter-spacing: -0.035em; line-height: 1.05; }
.auth-cta { width: 100%; height: 50px; margin-top: 24px; font-size: 12px; }
.auth-notice { margin-top: 14px; }
.who { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); }
.who__id { display: inline-flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: var(--font-weight-medium); }
.who__edit { flex: none; font-size: 13px; color: var(--color-brand-primary-300); }
.who__edit:hover { color: var(--color-text-default); }
.forgot { display: inline-block; margin-top: 12px; font-size: 13px; color: var(--color-brand-primary-300); }
.forgot:hover { color: var(--color-text-default); }
.auth-switch { margin-top: 28px; font-size: 13px; color: var(--color-text-muted); }
.auth-switch a { color: var(--color-text-default); font-weight: var(--font-weight-semibold); text-decoration: underline; text-underline-offset: 3px; }
</style>
