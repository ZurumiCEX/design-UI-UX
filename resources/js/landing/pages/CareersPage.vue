<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { toast } from '../composables/useToast.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZDialog from '../components/ui/ZDialog.vue';
import ZFileDrop from '../components/ui/ZFileDrop.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import ZIconTile from '../components/ui/ZIconTile.vue';
import ZSelect from '../components/ui/ZSelect.vue';
import ZTag from '../components/ui/ZTag.vue';

const { i18n, t } = useI18n();
const data = computed(() => i18n.content.pages.careers);

// ---------- Offres : filtres équipe / lieu / recherche ----------
const team = ref('all');
const place = ref('all');
const query = ref('');
const openJob = ref(null);
const teamOptions = computed(() => [{ value: 'all', label: data.value.jobs.allTeams }, ...Object.entries(data.value.jobs.teams).map(([value, label]) => ({ value, label }))]);
const placeOptions = computed(() => [{ value: 'all', label: data.value.jobs.allPlaces }, ...Object.entries(data.value.jobs.places).map(([value, label]) => ({ value, label }))]);
const jobs = computed(() => {
  const q = query.value.trim().toLowerCase();
  return data.value.jobs.items.filter(
    (j) => (team.value === 'all' || j.team === team.value) && (place.value === 'all' || j.place === place.value) && (!q || j.title.toLowerCase().includes(q)),
  );
});

// ---------- Candidature (DÉMO) ----------
// Jusqu'à 5 fichiers : CV, lettre, portfolio… (PDF, Word, images ; 5 Mo chacun).
const ACCEPT = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png';
const applying = ref(null); // offre, ou { spontaneous: true }
const form = reactive({ name: '', email: '', link: '', cv: [], message: '' });
const errors = reactive({});
function apply(job) {
  applying.value = job;
  Object.assign(form, { name: '', email: '', link: '', cv: [], message: '' });
  for (const k of Object.keys(errors)) delete errors[k];
}
function submit() {
  for (const k of Object.keys(errors)) delete errors[k];
  const e = data.value.apply.errors;
  if (form.name.trim().length < 2) errors.name = e.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = e.email;
  if (!form.cv.length && !form.link.trim()) errors.cv = e.cv;
  if (Object.keys(errors).length) return;
  applying.value = null;
  toast(data.value.apply.done, { tone: 'success' });
}
</script>

<template>
  <SiteLayout page="careers">
    <section class="cr-hero">
      <div class="container">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h1 v-split class="title title--display cr-hero__title" v-html="data.title" />
        <p v-reveal class="lede cr-hero__text">{{ data.text }}</p>
        <div v-reveal class="cr-hero__btns">
          <ZButton size="lg" href="#offres">{{ t(data.seeJobs, { n: data.jobs.items.length }) }}</ZButton>
          <ZButton size="lg" variant="ghost" @click="apply({ spontaneous: true })">{{ data.spontaneous }}</ZButton>
        </div>
      </div>
    </section>

    <section class="section cr-perks" aria-labelledby="cr-perks">
      <div class="container">
        <h2 id="cr-perks" v-split class="title" v-html="data.perks.title" />
        <ul class="cr-perks__grid">
          <li v-for="p in data.perks.items" :key="p.title" v-reveal>
            <ZIconTile :icon="p.icon" :size="38" />
            <div>
              <h3>{{ p.title }}</h3>
              <p>{{ p.text }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section id="offres" class="section cr-jobs" aria-labelledby="cr-jobs">
      <div class="container">
        <h2 id="cr-jobs" v-split class="title" v-html="data.jobs.title" />
        <div class="cr-filters">
          <label class="cr-search">
            <ZIcon name="search" :size="15" />
            <span class="sr-only">{{ data.jobs.search }}</span>
            <input v-model="query" type="search" :placeholder="data.jobs.search" />
          </label>
          <ZSelect v-model="team" :options="teamOptions" :label="data.jobs.team" />
          <ZSelect v-model="place" :options="placeOptions" :label="data.jobs.place" />
        </div>
        <ul class="cr-list">
          <li v-for="j in jobs" :key="j.id" class="job" :class="{ 'is-open': openJob === j.id }">
            <button type="button" class="job__head" :aria-expanded="openJob === j.id" :aria-controls="`job-${j.id}`" @click="openJob = openJob === j.id ? null : j.id">
              <span class="job__title">{{ j.title }}</span>
              <span class="job__meta">
                <span>{{ data.jobs.teams[j.team] }}</span>
                <span><ZIcon name="pin" :size="13" /> {{ data.jobs.places[j.place] }}</span>
                <span>{{ data.jobs.types[j.type] }}</span>
              </span>
              <ZIcon name="plus" :size="18" class="job__icon" />
            </button>
            <div v-if="openJob === j.id" :id="`job-${j.id}`" class="job__body">
              <p>{{ j.summary }}</p>
              <div class="job__cols">
                <div>
                  <h3>{{ data.jobs.missions }}</h3>
                  <ul><li v-for="m in j.missions" :key="m">{{ m }}</li></ul>
                </div>
                <div>
                  <h3>{{ data.jobs.profile }}</h3>
                  <ul><li v-for="m in j.profile" :key="m">{{ m }}</li></ul>
                </div>
              </div>
              <ZButton @click="apply(j)">{{ data.jobs.apply }}<span class="sr-only"> — {{ j.title }}</span></ZButton>
            </div>
          </li>
        </ul>
        <p v-if="!jobs.length" class="cr-empty" role="status">{{ data.jobs.empty }}</p>
        <p class="cr-demo">{{ data.demo }}</p>
      </div>
    </section>


    <ZDialog v-if="applying" :title="applying.spontaneous ? data.spontaneous : t(data.apply.title, { job: applying.title })" :close-label="data.apply.cancel" @close="applying = null">
      <form class="cr-form" novalidate @submit.prevent="submit">
        <div>
          <label class="z-label" for="cr-name">{{ data.apply.name }}</label>
          <input id="cr-name" v-model="form.name" class="z-input" autocomplete="name" :aria-invalid="!!errors.name" />
          <p v-if="errors.name" class="z-error">{{ errors.name }}</p>
        </div>
        <div>
          <label class="z-label" for="cr-email">{{ data.apply.email }}</label>
          <input id="cr-email" v-model="form.email" class="z-input" type="email" autocomplete="email" :aria-invalid="!!errors.email" />
          <p v-if="errors.email" class="z-error">{{ errors.email }}</p>
        </div>
        <div>
          <span class="z-label">{{ data.apply.cv }}</span>
          <ZFileDrop v-model="form.cv" :max="5" :max-size="5 * 1024 * 1024" :accept="ACCEPT" :label="data.apply.cvDrop" :hint="data.apply.cvHint" :errors="data.apply.fileErrors" :remove="data.apply.remove" :invalid="!!errors.cv" />
        </div>
        <div>
          <label class="z-label" for="cr-link">{{ data.apply.link }}</label>
          <input id="cr-link" v-model="form.link" class="z-input" type="url" placeholder="https://" />
          <p v-if="errors.cv" class="z-error">{{ errors.cv }}</p>
        </div>
        <div>
          <label class="z-label" for="cr-msg">{{ data.apply.message }}</label>
          <textarea id="cr-msg" v-model="form.message" class="z-input cr-form__area" />
        </div>
        <button type="submit" hidden />
      </form>
      <template #footer>
        <ZButton variant="ghost" @click="applying = null">{{ data.apply.cancel }}</ZButton>
        <ZButton @click="submit">{{ data.apply.submit }}</ZButton>
      </template>
    </ZDialog>
  </SiteLayout>
</template>

<style scoped>
.cr-hero { padding: calc(var(--space-nav-height) + 88px) 0 24px; background: radial-gradient(60% 70% at 85% 0%, color-mix(in srgb, var(--color-brand-secondary) 28%, transparent), transparent 70%); }
.cr-hero__title { margin-top: 26px; max-width: 12em; }
.cr-hero__text { margin-top: 22px; max-width: 52ch; }
.cr-hero__btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
.cr-perks__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 32px; margin-top: 40px; }
.cr-perks__grid li { display: flex; gap: 16px; }
.cr-perks__grid h3 { font-size: 16px; font-weight: var(--font-weight-semibold); }
.cr-perks__grid p { margin-top: 4px; font-size: 14px; color: var(--color-text-muted); }
.cr-jobs { padding-top: 0; scroll-margin-top: var(--space-nav-height); }
.cr-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 32px 0 16px; }
.cr-search { display: flex; flex: 1; min-width: 220px; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); color: var(--color-text-muted); }
.cr-search:focus-within { border-color: var(--color-brand-secondary-300); }
.cr-search input { flex: 1; min-width: 0; background: none; border: 0; outline: none; font-size: 13px; color: var(--color-text-default); }
.cr-list { border-top: 1px solid var(--color-line-default); }
.job { border-bottom: 1px solid var(--color-line-default); }
.job__head { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 24px; width: 100%; padding: 22px 6px; text-align: left; }
.job__head:hover .job__title { color: var(--color-brand-primary-300); }
.job__title { font-size: 17px; font-weight: var(--font-weight-semibold); transition: color var(--motion-duration-hover); }
.job__meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12.5px; color: var(--color-text-muted); }
.job__meta span { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-pill); background: var(--color-bg-surface-2); }
.job__icon { color: var(--color-text-muted); transition: transform var(--duration-panel) var(--motion-ease-out); }
.job.is-open .job__icon { transform: rotate(45deg); color: var(--color-brand-primary-300); }
.job__body { display: grid; gap: 18px; padding: 0 6px 28px; justify-items: start; }
.job__body > p { font-size: 15px; color: var(--color-text-muted); max-width: 70ch; }
.job__cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; width: 100%; }
.job__cols h3 { font-size: 14px; font-weight: var(--font-weight-semibold); }
.job__cols ul { display: grid; gap: 6px; margin-top: 10px; padding-left: 18px; list-style: disc; font-size: 14px; color: var(--color-text-muted); }
.cr-empty { padding: 40px 0; text-align: center; color: var(--color-text-muted); }
.cr-demo { margin-top: 36px; font-size: 12px; color: var(--color-text-dim); }
.cr-form { display: grid; gap: 14px; }
.cr-form__area { height: 110px; padding: 12px 14px; resize: vertical; }
@media (max-width: 900px) {
  .cr-perks__grid,   .job__head { grid-template-columns: minmax(0, 1fr) auto; }
  .job__meta { grid-column: 1; grid-row: 2; }
  .job__icon { grid-column: 2; grid-row: 1 / 3; }
  .job__cols { grid-template-columns: 1fr; }
}
</style>
