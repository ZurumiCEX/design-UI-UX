<script setup>
import { computed, reactive, ref } from 'vue';
import { demoDevices, demoLogins } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import { useProfile } from '../composables/useProfile.js';
import { useSecurityScore } from '../composables/useSecurityScore.js';
import { toast } from '../composables/useToast.js';
import AccountLayout from '../components/account/AccountLayout.vue';
import SecurityScore from '../components/account/SecurityScore.vue';
import OtpInput from '../components/auth/OtpInput.vue';
import PasswordField from '../components/auth/PasswordField.vue';
import { passwordRules } from '../components/auth/validate.js';
import ZButton from '../components/ui/ZButton.vue';
import ZDialog from '../components/ui/ZDialog.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZQrCode from '../components/ui/ZQrCode.vue';

const { i18n, fmt, t } = useI18n();
const { profile, save } = useProfile();
const { score, missing } = useSecurityScore(profile);
const data = computed(() => i18n.content.pages.security);
const auth = computed(() => i18n.content.auth);

const mask = (s) => (s.includes('@') ? s.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : s.replace(/\d(?=\d{2})/g, '•'));
const methods = computed(() => [
  { key: 'passkey', icon: 'fingerprint', recommended: true },
  { key: 'totp', icon: 'shield' },
  { key: 'email', icon: 'mail', value: mask(profile.email) },
  { key: 'phone', icon: 'phone', value: mask(profile.phone) },
  { key: 'password', icon: 'lock' },
  { key: 'antiPhishing', icon: 'badge', value: profile.security.antiPhishingCode },
]);
const setSecurity = (k, v, extra = {}) => save({ security: { ...profile.security, [k]: v, ...extra } });

// ---------- Dialogues ----------
const dialog = ref(''); // totp | totpOff | password | antiPhishing | freeze
const code = ref('');
const codeError = ref('');
// DÉMO — secret factice : en production il est généré et stocké par le serveur.
const secret = 'DEMOZRMK7Q4XW2PL';
const otpauth = computed(() => `otpauth://totp/Zurumi:${encodeURIComponent(profile.email)}?secret=${secret}&issuer=Zurumi`);
function open(name) {
  dialog.value = name;
  code.value = '';
  codeError.value = '';
  Object.assign(pw, { current: '', next: '', confirm: '' });
  for (const k of Object.keys(pwErrors)) delete pwErrors[k];
  phishing.value = profile.security.antiPhishingCode ?? '';
  phishingError.value = '';
}
function confirmTotp(enable) {
  if (code.value.length !== 6) return void (codeError.value = data.value.errors.code);
  setSecurity('totp', enable);
  dialog.value = '';
  toast(enable ? data.value.toasts.totpOn : data.value.toasts.totpOff, { tone: enable ? 'success' : 'warn' });
}

const pw = reactive({ current: '', next: '', confirm: '' });
const pwErrors = reactive({});
const rules = computed(() => passwordRules(pw.next));
function changePassword() {
  for (const k of Object.keys(pwErrors)) delete pwErrors[k];
  if (!pw.current) pwErrors.current = data.value.errors.current;
  if (!Object.values(rules.value).every(Boolean)) pwErrors.next = data.value.errors.rules;
  else if (pw.next === pw.current) pwErrors.next = data.value.errors.same;
  if (pw.confirm !== pw.next) pwErrors.confirm = data.value.errors.confirm;
  if (Object.keys(pwErrors).length) return;
  dialog.value = '';
  toast(data.value.toasts.password, { tone: 'success' });
}

const phishing = ref('');
const phishingError = ref('');
function savePhishing() {
  if (!/^[A-Za-z0-9]{4,20}$/.test(phishing.value)) return void (phishingError.value = data.value.errors.phishing);
  setSecurity('antiPhishing', true, { antiPhishingCode: phishing.value });
  dialog.value = '';
  toast(data.value.toasts.phishing, { tone: 'success' });
}

function onAction(m) {
  if (m.key === 'totp') return open(profile.security.totp ? 'totpOff' : 'totp');
  if (m.key === 'password') return open('password');
  if (m.key === 'antiPhishing') return open('antiPhishing');
  toast(data.value.toasts.demo[m.key], { tone: 'info' });
}

// ---------- Appareils ----------
const devices = ref(demoDevices.map((d) => ({ ...d })));
function revoke(id) {
  devices.value = devices.value.filter((d) => d.id !== id);
  toast(data.value.toasts.revoked, { tone: 'success' });
}
function revokeOthers() {
  devices.value = devices.value.filter((d) => d.current);
  toast(data.value.toasts.revokedAll, { tone: 'success' });
}
function freeze() {
  dialog.value = '';
  toast(data.value.toasts.freeze, { tone: 'warn' });
}
</script>

<template>
  <AccountLayout page="security" :title="data.title">
    <section class="sc__score z-panel" aria-labelledby="sc-score">
      <SecurityScore :score="score" :size="96" :label="data.score.title" />
      <div>
        <h2 id="sc-score">{{ data.score.title }}</h2>
        <p>{{ score >= 80 ? data.score.good : data.score.improve }}</p>
        <ul v-if="missing.length" class="sc__todo">
          <li v-for="k in missing" :key="k"><ZIcon name="alert" :size="13" /> {{ data.missing[k] }}</li>
        </ul>
      </div>
    </section>

    <section class="sc__block" aria-labelledby="sc-methods">
      <h2 id="sc-methods">{{ data.methods.title }}</h2>
      <p class="sc__lead">{{ data.methods.text }}</p>
      <ul class="sc__list">
        <li v-for="m in methods" :key="m.key" class="sc__item">
          <span class="sc__icon"><ZIcon :name="m.icon" :size="18" /></span>
          <div class="sc__what">
            <h3>{{ data.methods.items[m.key].title }} <span v-if="m.recommended" class="sc__rec">{{ data.methods.recommended }}</span></h3>
            <p>{{ data.methods.items[m.key].text }}</p>
          </div>
          <span class="sc__state" :class="profile.security[m.key] ? 'is-on' : 'is-off'">
            <ZIcon :name="profile.security[m.key] ? 'check' : 'info'" :size="14" />
            {{ profile.security[m.key] ? (m.value ?? data.methods.on) : data.methods.off }}
          </span>
          <ZButton variant="ghost" class="sc__btn" @click="onAction(m)">
            {{ m.key === 'totp' && profile.security.totp ? data.methods.disable : profile.security[m.key] && m.key !== 'passkey' ? data.methods.change : data.methods.setup }}
          </ZButton>
        </li>
      </ul>
    </section>

    <section class="sc__block" aria-labelledby="sc-devices">
      <div class="sc__head">
        <h2 id="sc-devices">{{ data.devices.title }}</h2>
        <ZButton v-if="devices.length > 1" variant="ghost" @click="revokeOthers">{{ data.devices.revokeAll }}</ZButton>
      </div>
      <ul class="sc__list">
        <li v-for="d in devices" :key="d.id" class="sc__item">
          <span class="sc__icon"><ZIcon :name="d.device === 'mobile' ? 'phone' : 'chart'" :size="18" /></span>
          <div class="sc__what">
            <h3>{{ d.name }} <span v-if="d.current" class="sc__rec">{{ data.devices.current }}</span></h3>
            <p>{{ d.place }} · {{ d.current ? data.devices.now : fmt.ago(d.lastActive) }}</p>
          </div>
          <ZButton v-if="!d.current" variant="ghost" class="sc__btn" @click="revoke(d.id)">{{ data.devices.revoke }}<span class="sr-only"> — {{ d.name }}</span></ZButton>
        </li>
      </ul>
    </section>

    <section class="sc__block" aria-labelledby="sc-logins">
      <h2 id="sc-logins">{{ data.logins.title }}</h2>
      <div class="sc__scroll" tabindex="0" :aria-label="data.logins.title"><table class="sc__table">
        <caption class="sr-only">{{ data.logins.title }}</caption>
        <thead><tr><th scope="col">{{ data.logins.cols.date }}</th><th scope="col">{{ data.logins.cols.device }}</th><th scope="col">{{ data.logins.cols.place }}</th><th scope="col" class="c-ip">{{ data.logins.cols.ip }}</th><th scope="col">{{ data.logins.cols.result }}</th></tr></thead>
        <tbody>
          <tr v-for="l in demoLogins" :key="l.at">
            <td class="num">{{ fmt.ago(l.at) }}</td>
            <td>{{ l.device }}</td>
            <td>{{ l.place }}</td>
            <td class="num c-ip">{{ l.ip }}</td>
            <td><span class="sc__res" :class="l.ok ? 'is-ok' : 'is-ko'"><ZIcon :name="l.ok ? 'check' : 'alert'" :size="13" /> {{ l.ok ? data.logins.ok : data.logins.failed }}</span></td>
          </tr>
        </tbody>
      </table></div>
    </section>

    <section class="sc__block sc__freeze z-panel" aria-labelledby="sc-freeze">
      <div>
        <h2 id="sc-freeze">{{ data.freeze.title }}</h2>
        <p>{{ data.freeze.text }}</p>
      </div>
      <ZButton variant="ghost" class="sc__danger" @click="open('freeze')">{{ data.freeze.cta }}</ZButton>
    </section>

    <!-- Google Authenticator -->
    <ZDialog v-if="dialog === 'totp'" :title="data.totp.title" :close-label="data.close" @close="dialog = ''">
      <ol class="sc__steps">
        <li>{{ data.totp.step1 }}</li>
        <li>
          {{ data.totp.step2 }}
          <div class="sc__qr"><ZQrCode :value="otpauth" :label="data.totp.qrAlt" :size="148" /><code class="num">{{ secret }}</code></div>
        </li>
        <li>{{ data.totp.step3 }}</li>
      </ol>
      <OtpInput v-model="code" :label="data.totp.code" :digit-label="i18n.content.pages.signup.verify.digit" :invalid="!!codeError" />
      <p v-if="codeError" class="z-error" role="alert">{{ codeError }}</p>
      <p class="z-hint">{{ data.demoHint }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="dialog = ''">{{ data.cancel }}</ZButton>
        <ZButton @click="confirmTotp(true)">{{ data.totp.enable }}</ZButton>
      </template>
    </ZDialog>

    <ZDialog v-if="dialog === 'totpOff'" :title="data.totp.offTitle" :close-label="data.close" size="sm" @close="dialog = ''">
      <p class="sc__dlg-text">{{ data.totp.offText }}</p>
      <OtpInput v-model="code" :label="data.totp.code" :digit-label="i18n.content.pages.signup.verify.digit" :invalid="!!codeError" />
      <p v-if="codeError" class="z-error" role="alert">{{ codeError }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="dialog = ''">{{ data.cancel }}</ZButton>
        <ZButton class="sc__danger" @click="confirmTotp(false)">{{ data.methods.disable }}</ZButton>
      </template>
    </ZDialog>

    <!-- Mot de passe -->
    <ZDialog v-if="dialog === 'password'" :title="data.password.title" :close-label="data.close" @close="dialog = ''">
      <div class="sc__form">
        <PasswordField id="sc-pw-current" v-model="pw.current" :label="data.password.current" :labels="auth.password" autocomplete="current-password" :error="pwErrors.current ?? ''" />
        <PasswordField id="sc-pw-new" v-model="pw.next" :label="data.password.next" :labels="auth.password" autocomplete="new-password" :error="pwErrors.next ?? ''" describedby="sc-pw-rules" />
        <ul id="sc-pw-rules" class="sc__rules">
          <li v-for="(label, key) in i18n.content.pages.signup.password.rules" :key="key" :class="{ 'is-ok': rules[key] }"><ZIcon :name="rules[key] ? 'check' : 'minus'" :size="13" /> {{ label }}</li>
        </ul>
        <PasswordField id="sc-pw-confirm" v-model="pw.confirm" :label="data.password.confirm" :labels="auth.password" autocomplete="new-password" :error="pwErrors.confirm ?? ''" />
        <p class="z-notice">{{ data.password.notice }}</p>
      </div>
      <template #footer>
        <ZButton variant="ghost" @click="dialog = ''">{{ data.cancel }}</ZButton>
        <ZButton @click="changePassword">{{ data.password.submit }}</ZButton>
      </template>
    </ZDialog>

    <!-- Code anti-phishing -->
    <ZDialog v-if="dialog === 'antiPhishing'" :title="data.phishing.title" :close-label="data.close" size="sm" @close="dialog = ''">
      <p class="sc__dlg-text">{{ data.phishing.text }}</p>
      <label class="z-label" for="sc-phishing">{{ data.phishing.label }}</label>
      <input id="sc-phishing" v-model="phishing" class="z-input" maxlength="20" autocomplete="off" :aria-invalid="!!phishingError" aria-describedby="sc-phishing-hint" />
      <p v-if="phishingError" class="z-error">{{ phishingError }}</p>
      <p v-else id="sc-phishing-hint" class="z-hint">{{ data.phishing.hint }}</p>
      <div v-if="phishing" class="sc__mail">
        <span class="label">{{ data.phishing.preview }}</span>
        <p>{{ data.phishing.previewText }} <strong>{{ phishing }}</strong></p>
      </div>
      <template #footer>
        <ZButton variant="ghost" @click="dialog = ''">{{ data.cancel }}</ZButton>
        <ZButton @click="savePhishing">{{ data.save }}</ZButton>
      </template>
    </ZDialog>

    <!-- Gel du compte -->
    <ZDialog v-if="dialog === 'freeze'" :title="data.freeze.title" :close-label="data.close" size="sm" @close="dialog = ''">
      <ul class="sc__freeze-list">
        <li v-for="item in data.freeze.effects" :key="item"><ZIcon name="lock" :size="14" /> {{ item }}</li>
      </ul>
      <template #footer>
        <ZButton variant="ghost" @click="dialog = ''">{{ data.cancel }}</ZButton>
        <ZButton class="sc__danger" @click="freeze">{{ data.freeze.confirm }}</ZButton>
      </template>
    </ZDialog>
  </AccountLayout>
</template>

<style scoped>
.sc__score { display: flex; align-items: center; gap: 24px; margin-top: 28px; padding: 24px; }
.sc__score h2 { font-size: 16px; font-weight: var(--font-weight-semibold); }
.sc__score p { margin-top: 4px; font-size: 13px; color: var(--color-text-muted); }
.sc__todo { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 12.5px; color: var(--color-text-muted); }
.sc__todo li { display: flex; align-items: center; gap: 6px; }
.sc__todo :deep(svg) { color: var(--color-state-warn); }
.sc__block { margin-top: 40px; }
.sc__block > h2, .sc__head h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.sc__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px 16px; }
.sc__lead { margin-top: 6px; font-size: 13px; color: var(--color-text-muted); }
.sc__list { margin-top: 16px; }
.sc__item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 16px; padding: 18px 12px; border-bottom: 1px solid var(--color-line-default); border-radius: var(--radius-sm); transition: background-color var(--motion-duration-hover); }
.sc__item:hover { background: var(--fill-1); }
.sc__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--color-bg-surface-2); color: var(--color-text-muted); }
.sc__what h3 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 15px; font-weight: var(--font-weight-medium); }
.sc__what p { margin-top: 3px; font-size: 13px; color: var(--color-text-muted); }
.sc__rec { padding: 2px 8px; border-radius: var(--radius-sm); font-size: 11px; color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 26%, transparent); }
.sc__state { display: inline-flex; align-items: center; gap: 6px; min-width: 150px; font-size: 13px; }
.sc__state.is-on { color: var(--color-state-up); }
.sc__state.is-on :deep(svg) + * { color: var(--color-text-default); }
.sc__state.is-off { color: var(--color-text-muted); }
.sc__btn { min-width: 110px; }
.sc__scroll { overflow-x: auto; }
.sc__table { width: 100%; min-width: 520px; margin-top: 16px; border-collapse: collapse; font-size: 13.5px; }
.sc__table th { padding: 10px 12px; font-size: 12px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); text-align: left; background: var(--color-bg-surface-2); }
.sc__table th:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.sc__table th:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.sc__table td { padding: 14px 12px; border-bottom: 1px solid var(--color-line-default); }
.sc__res { display: inline-flex; align-items: center; gap: 6px; }
.sc__res.is-ok { color: var(--color-state-up); }
.sc__res.is-ko { color: var(--color-state-down); }
.sc__freeze { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px; border-color: color-mix(in srgb, var(--color-state-down) 35%, transparent); }
.sc__freeze p { margin-top: 6px; font-size: 13px; color: var(--color-text-muted); max-width: 60ch; }
.sc__danger { color: var(--color-state-down) !important; border-color: color-mix(in srgb, var(--color-state-down) 45%, transparent) !important; background: transparent !important; box-shadow: none !important; }
.sc__steps { display: grid; gap: 12px; margin-bottom: 18px; padding-left: 20px; list-style: decimal; font-size: 14px; color: var(--color-text-muted); }
.sc__qr { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
.sc__qr code { padding: 8px 12px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--color-text-default); letter-spacing: 0.08em; }
.sc__dlg-text { margin-bottom: 16px; font-size: 14px; color: var(--color-text-muted); }
.sc__form { display: grid; gap: 14px; }
.sc__rules { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 12px; color: var(--color-text-dim); }
.sc__rules li { display: flex; align-items: center; gap: 6px; }
.sc__rules li.is-ok { color: var(--color-state-up); }
.sc__mail { margin-top: 16px; padding: 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); }
.sc__mail .label { color: var(--color-text-dim); }
.sc__mail p { margin-top: 6px; font-size: 13px; color: var(--color-text-muted); }
.sc__mail strong { color: var(--color-brand-primary-300); }
.sc__freeze-list { display: grid; gap: 10px; font-size: 14px; color: var(--color-text-muted); }
.sc__freeze-list li { display: flex; gap: 10px; }
.sc__freeze-list :deep(svg) { flex: none; margin-top: 3px; color: var(--color-state-down); }
@media (max-width: 860px) {
  .sc__item { grid-template-columns: auto minmax(0, 1fr); }
  .sc__state { grid-column: 2; min-width: 0; }
  .sc__btn { grid-column: 2; justify-self: start; }
  .c-ip { display: none; }
  .sc__table { min-width: 0; }
  .sc__table td, .sc__table th { padding-inline: 8px; }
  .sc__freeze, .sc__score { flex-direction: column; align-items: flex-start; }
}
</style>
