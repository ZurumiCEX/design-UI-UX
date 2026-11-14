<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZIconTile from '../components/ui/ZIconTile.vue';
import ZSelect from '../components/ui/ZSelect.vue';
import ZSocialIcon, { SOCIAL_ICONS } from '../components/ui/ZSocialIcon.vue';
import ZTag from '../components/ui/ZTag.vue';

const { i18n, t } = useI18n();
const data = computed(() => i18n.content.pages.contact);
const links = computed(() => i18n.content.common.links);

const form = reactive({ name: '', email: '', topic: '', reference: '', message: '', consent: false });
const errors = reactive({});
const sending = ref(false);
const ticket = ref('');
const topicOptions = computed(() => [{ value: '', label: data.value.form.topicPick }, ...Object.entries(data.value.form.topics).map(([value, label]) => ({ value, label }))]);
const MIN = 20;

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = data.value.form.errors;
  if (form.name.trim().length < 2) errors.name = e.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = e.email;
  if (!form.topic) errors.topic = e.topic;
  if (form.message.trim().length < MIN) errors.message = t(e.message, { n: MIN });
  if (!form.consent) errors.consent = e.consent;
  return !Object.keys(errors).length;
}
async function submit() {
  if (!validate()) return document.querySelector('.ct-form [aria-invalid="true"]')?.focus();
  sending.value = true;
  await new Promise((r) => setTimeout(r, 700)); // DÉMO — remplacer par POST vers links.contactAction
  sending.value = false;
  ticket.value = `ZRM-SUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function reset() {
  Object.assign(form, { name: '', email: '', topic: '', reference: '', message: '', consent: false });
  ticket.value = '';
}
</script>

<template>
  <SiteLayout page="contact">
    <section class="ct-hero">
      <div class="container">
        <ZTag v-if="data.tag" v-reveal>{{ data.tag }}</ZTag>
        <h1 v-split class="title title--display ct-hero__title" v-html="data.title" />
        <p v-reveal class="lede ct-hero__text">{{ data.text }}</p>
      </div>
    </section>

    <div class="container ct-channels">
      <a v-for="c in data.channels" :key="c.title" v-reveal class="ct-channel z-panel" :href="links[c.link]" :rel="c.brand ? 'noopener' : undefined">
        <span v-if="c.brand" class="ct-brand" :style="{ '--brand': SOCIAL_ICONS[c.brand].color }"><ZSocialIcon :name="c.brand" :size="20" /></span>
        <ZIconTile v-else :icon="c.icon" :size="38" />
        <h2>{{ c.title }}</h2>
        <p>{{ c.text }}</p>
        <span class="ct-channel__go">{{ c.cta }} <ZIcon name="arrow-right" :size="13" /></span>
      </a>
    </div>

    <div class="container ct-grid">
      <section class="ct-form-wrap z-panel" aria-labelledby="ct-form">
        <template v-if="!ticket">
          <h2 id="ct-form">{{ data.form.title }}</h2>
          <p class="ct-form-lead">{{ data.form.text }}</p>
          <form class="ct-form" novalidate @submit.prevent="submit">
            <div class="ct-row">
              <div>
                <label class="z-label" for="ct-name">{{ data.form.name }}</label>
                <input id="ct-name" v-model="form.name" class="z-input" autocomplete="name" :aria-invalid="!!errors.name" />
                <p v-if="errors.name" class="z-error">{{ errors.name }}</p>
              </div>
              <div>
                <label class="z-label" for="ct-email">{{ data.form.email }}</label>
                <input id="ct-email" v-model="form.email" class="z-input" type="email" autocomplete="email" :aria-invalid="!!errors.email" />
                <p v-if="errors.email" class="z-error">{{ errors.email }}</p>
              </div>
            </div>
            <div class="ct-row">
              <div>
                <span class="z-label">{{ data.form.topic }}</span>
                <ZSelect v-model="form.topic" variant="field" :options="topicOptions" :label="data.form.topic" />
                <p v-if="errors.topic" class="z-error">{{ errors.topic }}</p>
              </div>
              <div>
                <label class="z-label" for="ct-ref">{{ data.form.reference }} <span class="ct-opt">{{ data.form.optional }}</span></label>
                <input id="ct-ref" v-model="form.reference" class="z-input num" autocomplete="off" placeholder="TX…" />
              </div>
            </div>
            <div>
              <label class="z-label" for="ct-msg">{{ data.form.message }}</label>
              <textarea id="ct-msg" v-model="form.message" class="z-input ct-area" :placeholder="data.form.messagePlaceholder" :aria-invalid="!!errors.message" aria-describedby="ct-msg-count" />
              <p v-if="errors.message" class="z-error">{{ errors.message }}</p>
              <p v-else id="ct-msg-count" class="z-hint num">{{ t(data.form.count, { n: form.message.trim().length, min: MIN }) }}</p>
            </div>
            <label class="ct-consent">
              <input v-model="form.consent" type="checkbox" :aria-invalid="!!errors.consent" />
              <span class="ct-box" aria-hidden="true"><ZIcon name="check" :size="12" /></span>
              <span>{{ data.form.consent }}</span>
            </label>
            <p v-if="errors.consent" class="z-error">{{ errors.consent }}</p>
            <ZButton type="submit" size="lg" class="ct-submit" :disabled="sending">{{ sending ? data.form.sending : data.form.submit }}</ZButton>
          </form>
        </template>
        <div v-else class="ct-done" role="status">
          <span class="ct-done__icon" aria-hidden="true"><ZIcon name="check" :size="24" /></span>
          <h2>{{ data.form.done.title }}</h2>
          <p>{{ t(data.form.done.text, { email: form.email }) }}</p>
          <p class="ct-ticket"><span class="label">{{ data.form.done.ticket }}</span> <strong class="num">{{ ticket }}</strong></p>
          <p class="ct-demo">{{ data.form.done.demo }}</p>
          <ZButton variant="ghost" @click="reset">{{ data.form.done.again }}</ZButton>
        </div>
      </section>

      <aside class="ct-side">
        <section class="ct-card z-panel" aria-labelledby="ct-hours">
          <h2 id="ct-hours"><ZIcon name="clock" :size="16" /> {{ data.hours.title }}</h2>
          <dl>
            <div v-for="h in data.hours.items" :key="h.label"><dt>{{ h.label }}</dt><dd>{{ h.value }}</dd></div>
          </dl>
        </section>
        <section class="ct-card z-panel" aria-labelledby="ct-office">
          <h2 id="ct-office"><ZIcon name="pin" :size="16" /> {{ data.office.title }}</h2>
          <p>{{ data.office.address }}</p>
        </section>
        <section class="ct-card ct-card--warn z-panel" aria-labelledby="ct-safe">
          <h2 id="ct-safe"><ZIcon name="shield" :size="16" /> {{ data.safety.title }}</h2>
          <p>{{ data.safety.text }}</p>
          <a :href="links.verify">{{ data.safety.cta }} <ZIcon name="arrow-right" :size="13" /></a>
        </section>
      </aside>
    </div>
  </SiteLayout>
</template>

<style scoped>
.ct-hero { padding: calc(var(--space-nav-height) + 88px) 0 40px; }
.ct-hero__title { margin-top: 26px; max-width: 12em; }
.ct-hero__text { margin-top: 22px; max-width: 54ch; }
.ct-channels { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.ct-channel { display: flex; flex-direction: column; gap: 6px; padding: 22px; transition: border-color var(--motion-duration-hover), transform var(--motion-duration-hover) var(--motion-ease-out); }
.ct-channel:hover { border-color: var(--color-brand-primary-300); transform: translateY(-2px); }
.ct-brand { display: grid; place-items: center; width: 38px; height: 38px; border-radius: var(--radius-md); color: var(--brand); background: color-mix(in srgb, var(--brand) 14%, transparent); border: 1px solid color-mix(in srgb, var(--brand) 35%, transparent); }
.ct-channel h2 { margin-top: 12px; font-size: 16px; font-weight: var(--font-weight-semibold); }
.ct-channel p { flex: 1; font-size: 13px; color: var(--color-text-muted); }
.ct-channel__go { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; font-weight: var(--font-weight-medium); color: var(--color-brand-primary-300); overflow-wrap: anywhere; }
.ct-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; margin: 40px auto var(--space-section-y); }
.ct-form-wrap { padding: 32px; }
.ct-form-wrap h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.ct-form-lead { margin-top: 6px; font-size: 14px; color: var(--color-text-muted); }
.ct-form { display: grid; gap: 16px; margin-top: 24px; }
.ct-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ct-opt { color: var(--color-text-dim); }
.ct-area { font: inherit; font-size: 15px; height: 150px; padding: 12px 14px; resize: vertical; line-height: 1.5; }
.ct-consent { position: relative; display: flex; gap: 12px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.ct-consent input { position: absolute; opacity: 0; width: 18px; height: 18px; margin: 0; }
.ct-box { display: grid; place-items: center; flex: none; width: 18px; height: 18px; margin-top: 1px; border-radius: 5px; border: 1px solid var(--color-text-dim); color: transparent; }
.ct-consent input:checked + .ct-box { background: var(--gradient-brand); border-color: transparent; color: var(--color-on-brand); }
.ct-consent input:focus-visible + .ct-box { outline: 2px solid var(--color-brand-secondary-300); outline-offset: 2px; }
.ct-consent input[aria-invalid='true'] + .ct-box { border-color: var(--color-state-down); }
.ct-submit { width: 100%; height: 52px; }
.ct-done { display: grid; justify-items: center; gap: 10px; padding: 24px 0; text-align: center; }
.ct-done__icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--gradient-brand); box-shadow: 0 0 50px -10px var(--glow-brand);  color: var(--color-on-brand); }
.ct-done p { font-size: 14px; color: var(--color-text-muted); max-width: 46ch; }
.ct-ticket { display: grid; gap: 4px; padding: 14px 24px; border-radius: var(--radius-md); border: 1px dashed var(--color-line-strong); }
.ct-ticket strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px; color: var(--color-text-default); }
.ct-demo { font-size: 12px !important; color: var(--color-state-warn) !important; }
.ct-side { position: sticky; top: calc(var(--space-nav-height) + 24px); display: grid; gap: 14px; }
.ct-card { padding: 22px; }
.ct-card h2 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--font-weight-semibold); }
.ct-card h2 :deep(svg) { color: var(--color-brand-primary-300); }
.ct-card p { margin-top: 8px; font-size: 13px; color: var(--color-text-muted); }
.ct-card dl { display: grid; gap: 8px; margin: 12px 0 0; font-size: 13px; }
.ct-card dl div { display: flex; justify-content: space-between; gap: 12px; }
.ct-card dt { color: var(--color-text-muted); }
.ct-card dd { margin: 0; text-align: right; }
.ct-card a { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 13px; color: var(--color-brand-primary-300); }
.ct-card--warn { border-color: color-mix(in srgb, var(--color-state-warn) 35%, transparent); }
.ct-card--warn h2 :deep(svg) { color: var(--color-state-warn); }
@media (max-width: 1100px) { .ct-channels { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) {
  .ct-grid { grid-template-columns: 1fr; }
  .ct-side { position: static; }
  .ct-row { grid-template-columns: 1fr; }
  .ct-form-wrap { padding: 22px; }
}
@media (max-width: 520px) { .ct-channels { grid-template-columns: 1fr; } }
</style>
