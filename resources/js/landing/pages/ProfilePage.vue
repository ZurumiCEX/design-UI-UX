<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { useProfile } from '../composables/useProfile.js';
import { toast } from '../composables/useToast.js';
import AccountLayout from '../components/account/AccountLayout.vue';
import ZAvatar from '../components/ui/ZAvatar.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZDialog from '../components/ui/ZDialog.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZSelect from '../components/ui/ZSelect.vue';

const { i18n, fmt, setLocale } = useI18n();
const { profile, save, demo } = useProfile();
const data = computed(() => i18n.content.pages.profile);
const common = computed(() => i18n.content.common);

const pick = () => ({
  firstName: profile.firstName, lastName: profile.lastName, username: profile.username, country: profile.country,
  city: profile.city, address: profile.address, language: profile.language, currency: profile.currency,
  avatar: profile.avatar, notifications: { ...profile.notifications },
});
const draft = reactive(pick());
const errors = reactive({});
const saving = ref(false);
const dirty = computed(() => JSON.stringify(draft) !== JSON.stringify(pick()));
const initials = computed(() => `${draft.firstName?.[0] ?? ''}${draft.lastName?.[0] ?? ''}`.toUpperCase());
const verified = computed(() => profile.kyc.level >= 1);

const countryOptions = computed(() => common.value.countries.map((c) => ({ value: c.id, label: c.name })));
const languageOptions = computed(() => common.value.languages.map((l) => ({ value: l.code, label: l.label })));
const currencyOptions = [{ value: 'XOF', label: 'XOF — Franc CFA' }, { value: 'USD', label: 'USD — Dollar' }];

// ---------- Photo : redimensionnée à 256 px dans le navigateur avant envoi ----------
const fileInput = ref(null);
const photoError = ref('');
function onPhoto(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  photoError.value = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return void (photoError.value = data.value.photo.errors.type);
  if (file.size > 5 * 1024 * 1024) return void (photoError.value = data.value.photo.errors.size);
  const img = new Image();
  img.onload = () => {
    const s = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
    draft.avatar = canvas.toDataURL('image/jpeg', 0.86);
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = data.value.errors;
  if (draft.firstName.trim().length < 2) errors.firstName = e.firstName;
  if (draft.lastName.trim().length < 2) errors.lastName = e.lastName;
  if (!/^[a-z0-9._]{3,20}$/.test(draft.username)) errors.username = e.username;
  return !Object.keys(errors).length;
}
async function onSave() {
  if (!validate()) return document.querySelector('.pf [aria-invalid="true"]')?.focus();
  saving.value = true;
  await new Promise((r) => setTimeout(r, 500)); // DÉMO — remplacer par l'appel à links.profileAction
  const langChanged = draft.language !== profile.language;
  save(draft);
  saving.value = false;
  if (langChanged) await setLocale(draft.language);
  toast(demo ? data.value.savedDemo : data.value.saved, { tone: 'success' });
}
function onReset() {
  Object.assign(draft, pick());
  for (const k of Object.keys(errors)) delete errors[k];
}

const closing = ref(false);
const closeConfirm = ref('');
function closeAccount() {
  closing.value = false;
  toast(data.value.close.demo, { tone: 'warn' });
}
</script>

<template>
  <AccountLayout page="profile" :title="data.title">
    <form class="pf" novalidate @submit.prevent="onSave">
      <section class="pf__card z-panel" aria-labelledby="pf-photo">
        <h2 id="pf-photo">{{ data.photo.title }}</h2>
        <div class="pf__photo">
          <ZAvatar :src="draft.avatar ?? ''" :initials="initials" :size="88" />
          <div>
            <div class="pf__photo-btns">
              <ZButton variant="ghost" @click="fileInput.click()"><ZIcon name="upload" :size="14" /> {{ data.photo.change }}</ZButton>
              <ZButton v-if="draft.avatar" variant="ghost" @click="draft.avatar = null">{{ data.photo.remove }}</ZButton>
            </div>
            <p class="z-hint">{{ data.photo.hint }}</p>
            <p v-if="photoError" class="z-error" role="alert">{{ photoError }}</p>
          </div>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPhoto" />
        </div>
      </section>

      <section class="pf__card z-panel" aria-labelledby="pf-info">
        <h2 id="pf-info">{{ data.info.title }}</h2>
        <div class="pf__grid">
          <div>
            <label class="z-label" for="pf-first">{{ data.info.firstName }}</label>
            <input id="pf-first" v-model="draft.firstName" class="z-input" autocomplete="given-name" :readonly="verified" :aria-invalid="!!errors.firstName" :aria-describedby="verified ? 'pf-lock' : undefined" />
            <p v-if="errors.firstName" class="z-error">{{ errors.firstName }}</p>
          </div>
          <div>
            <label class="z-label" for="pf-last">{{ data.info.lastName }}</label>
            <input id="pf-last" v-model="draft.lastName" class="z-input" autocomplete="family-name" :readonly="verified" :aria-invalid="!!errors.lastName" :aria-describedby="verified ? 'pf-lock' : undefined" />
            <p v-if="errors.lastName" class="z-error">{{ errors.lastName }}</p>
          </div>
          <div>
            <label class="z-label" for="pf-user">{{ data.info.username }}</label>
            <input id="pf-user" v-model="draft.username" class="z-input" autocomplete="username" :aria-invalid="!!errors.username" aria-describedby="pf-user-hint" />
            <p v-if="errors.username" class="z-error">{{ errors.username }}</p>
            <p v-else id="pf-user-hint" class="z-hint">{{ data.info.usernameHint }}</p>
          </div>
          <div>
            <label class="z-label" for="pf-birth">{{ data.info.birthDate }}</label>
            <input id="pf-birth" class="z-input" :value="fmt.date(new Date(profile.birthDate), { dateStyle: 'long' })" readonly aria-describedby="pf-lock" />
          </div>
        </div>
        <p v-if="verified" id="pf-lock" class="pf__lock"><ZIcon name="lock" :size="14" /> {{ data.info.locked }}</p>
      </section>

      <section class="pf__card z-panel" aria-labelledby="pf-contact">
        <h2 id="pf-contact">{{ data.contact.title }}</h2>
        <div class="pf__grid">
          <div>
            <span class="z-label">{{ data.contact.email }}</span>
            <p class="pf__ro">{{ profile.email }} <a :href="common.links.accountSecurity">{{ data.contact.change }}</a></p>
          </div>
          <div>
            <span class="z-label">{{ data.contact.phone }}</span>
            <p class="pf__ro num">{{ profile.phone }} <a :href="common.links.accountSecurity">{{ data.contact.change }}</a></p>
          </div>
          <div>
            <span class="z-label">{{ data.contact.country }}</span>
            <ZSelect v-model="draft.country" variant="field" :options="countryOptions" :label="data.contact.country" />
          </div>
          <div>
            <label class="z-label" for="pf-city">{{ data.contact.city }}</label>
            <input id="pf-city" v-model="draft.city" class="z-input" autocomplete="address-level2" />
          </div>
          <div class="pf__wide">
            <label class="z-label" for="pf-address">{{ data.contact.address }}</label>
            <input id="pf-address" v-model="draft.address" class="z-input" autocomplete="street-address" :placeholder="data.contact.addressPlaceholder" />
          </div>
        </div>
      </section>

      <section id="notifications" class="pf__card z-panel" aria-labelledby="pf-prefs">
        <h2 id="pf-prefs">{{ data.prefs.title }}</h2>
        <div class="pf__grid">
          <div>
            <span class="z-label">{{ data.prefs.language }}</span>
            <ZSelect v-model="draft.language" variant="field" :options="languageOptions" :label="data.prefs.language" />
          </div>
          <div>
            <span class="z-label">{{ data.prefs.currency }}</span>
            <ZSelect v-model="draft.currency" variant="field" :options="currencyOptions" :label="data.prefs.currency" />
          </div>
        </div>
        <h3 class="pf__sub">{{ data.prefs.notifications }}</h3>
        <ul class="pf__toggles">
          <li v-for="(label, key) in data.prefs.channels" :key="key">
            <label class="pf__toggle">
              <span><strong>{{ label.title }}</strong><small>{{ label.text }}</small></span>
              <input v-model="draft.notifications[key]" type="checkbox" :disabled="key === 'security'" />
              <span class="pf__switch" aria-hidden="true" />
            </label>
          </li>
        </ul>
      </section>

      <section class="pf__card z-panel pf__meta" aria-labelledby="pf-acc">
        <h2 id="pf-acc">{{ data.account.title }}</h2>
        <dl>
          <div><dt>UID</dt><dd class="num">{{ profile.uid }}</dd></div>
          <div><dt>{{ data.account.created }}</dt><dd>{{ fmt.date(new Date(profile.createdAt), { dateStyle: 'long' }) }}</dd></div>
        </dl>
        <div class="pf__danger">
          <div><strong>{{ data.close.title }}</strong><p>{{ data.close.text }}</p></div>
          <ZButton variant="ghost" class="pf__danger-btn" @click="closing = true">{{ data.close.cta }}</ZButton>
        </div>
      </section>

      <div class="pf__bar" :class="{ 'is-on': dirty }" role="region" :aria-label="data.unsaved" :aria-hidden="!dirty">
        <p>{{ data.unsaved }}</p>
        <ZButton variant="ghost" :tabindex="dirty ? 0 : -1" @click="onReset">{{ data.cancel }}</ZButton>
        <ZButton type="submit" :tabindex="dirty ? 0 : -1" :disabled="saving">{{ saving ? data.saving : data.save }}</ZButton>
      </div>
    </form>

    <ZDialog v-if="closing" :title="data.close.title" :close-label="data.cancel" size="sm" @close="closing = false">
      <p class="pf__dlg-text">{{ data.close.confirm }}</p>
      <label class="z-label" for="pf-close">{{ data.close.type }}</label>
      <input id="pf-close" v-model="closeConfirm" class="z-input" autocomplete="off" />
      <template #footer>
        <ZButton variant="ghost" @click="closing = false">{{ data.cancel }}</ZButton>
        <ZButton class="pf__danger-btn" :disabled="closeConfirm !== data.close.word" @click="closeAccount">{{ data.close.cta }}</ZButton>
      </template>
    </ZDialog>
  </AccountLayout>
</template>

<style scoped>
.pf { display: grid; gap: 20px; max-width: 860px; margin-top: 28px; padding-bottom: 80px; }
.pf__card { padding: 24px; }
.pf__card h2 { font-size: 16px; font-weight: var(--font-weight-semibold); margin-bottom: 18px; }
.pf__photo { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.pf__photo-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.pf__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.pf__wide { grid-column: 1 / -1; }
.pf input[readonly] { color: var(--color-text-muted); background: var(--color-bg-surface-2); cursor: default; }
.pf__lock { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 12.5px; color: var(--color-text-muted); }
.pf__ro { display: flex; justify-content: space-between; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 14px; color: var(--color-text-muted); }
.pf__ro a { font-size: 13px; color: var(--color-brand-primary-300); }
.pf__sub { margin: 24px 0 8px; font-size: 14px; font-weight: var(--font-weight-semibold); }
.pf__toggles li + li { border-top: 1px solid var(--color-line-default); }
.pf__toggle { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 0; cursor: pointer; }
.pf__toggle strong { display: block; font-size: 14px; font-weight: var(--font-weight-medium); }
.pf__toggle small { font-size: 12.5px; color: var(--color-text-muted); }
.pf__toggle input { position: absolute; opacity: 0; }
.pf__switch { position: relative; flex: none; width: 38px; height: 22px; border-radius: var(--radius-pill); background: var(--color-line-strong); transition: background-color var(--motion-duration-hover); }
.pf__switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--color-text-default); transition: transform var(--motion-duration-hover) var(--motion-ease-out); }
.pf__toggle input:checked + .pf__switch { background: var(--color-brand-primary); }
.pf__toggle input:checked + .pf__switch::after { transform: translateX(16px); }
.pf__toggle input:disabled + .pf__switch { opacity: 0.5; }
.pf__toggle input:focus-visible + .pf__switch { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.pf__meta dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; font-size: 14px; }
.pf__meta dt { font-size: 12px; color: var(--color-text-muted); }
.pf__meta dd { margin: 4px 0 0; }
.pf__danger { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--color-line-default); }
.pf__danger strong { font-size: 14px; }
.pf__danger p { font-size: 12.5px; color: var(--color-text-muted); }
.pf__danger-btn { color: var(--color-state-down) !important; border-color: color-mix(in srgb, var(--color-state-down) 45%, transparent) !important; background: transparent !important; box-shadow: none !important; }
.pf__dlg-text { margin-bottom: 16px; font-size: 14px; color: var(--color-text-muted); }
.pf__bar {
  position: fixed; left: 50%; bottom: 20px; z-index: 40; display: flex; align-items: center; gap: 10px; width: min(620px, calc(100vw - 32px)); padding: 12px 12px 12px 20px;
  border-radius: var(--radius-pill); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); box-shadow: 0 24px 60px -20px var(--ink);
  transform: translate(-50%, 140%); opacity: 0; transition: transform var(--duration-panel) var(--motion-ease-out), opacity var(--duration-panel);
}
.pf__bar.is-on { transform: translate(-50%, 0); opacity: 1; }
.pf__bar p { flex: 1; font-size: 13px; color: var(--color-text-muted); }
@media (max-width: 700px) {
  .pf__grid, .pf__meta dl { grid-template-columns: 1fr; }
  .pf__danger { flex-direction: column; align-items: flex-start; }
  .pf__bar { border-radius: var(--radius-lg); flex-wrap: wrap; }
}
</style>
