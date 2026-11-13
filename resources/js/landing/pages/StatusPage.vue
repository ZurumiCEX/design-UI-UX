<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../composables/useI18n.js';
import { toast } from '../composables/useToast.js';
import { DAYS, statusData, worstOf } from '../market/status.js';
import SiteLayout from '../components/layout/SiteLayout.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZDialog from '../components/ui/ZDialog.vue';
import ZIcon from '../components/ui/ZIcon.vue';

// État des services : bandeau global, composants groupés avec 90 jours de disponibilité,
// maintenance planifiée, historique des incidents, abonnement aux alertes.
const { i18n, fmt, t } = useI18n();
const data = computed(() => i18n.content.pages.status);
const { groups, worst } = statusData();
const open = reactive(Object.fromEntries(groups.map((g) => [g.group, true])));
const updated = new Date();
const icons = { operational: 'check', degraded: 'alert', partial: 'alert', major: 'close', maintenance: 'clock' };

const DAY = 86400e3;
const dayDate = (i) => new Date(Date.now() - (DAYS - 1 - i) * DAY);
const tip = ref(null); // { x, y, text }
function showTip(e, c, i) {
  const r = e.currentTarget.getBoundingClientRect();
  const level = c.days[i];
  const text = `${fmt.date(dayDate(i), { dateStyle: 'medium' })} — ${data.value.levels[level]}`;
  tip.value = { x: r.left + r.width / 2, y: r.top, text };
}

const subscribing = ref(false);
const email = ref('');
const emailError = ref('');
function subscribe() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return void (emailError.value = data.value.subscribe.error);
  subscribing.value = false;
  toast(data.value.subscribe.done, { tone: 'success' });
}
const incidentDate = (ago) => fmt.date(new Date(Date.now() - ago * DAY), { dateStyle: 'long' });
</script>

<template>
  <SiteLayout page="status">
    <div class="container page st">
      <header class="st__head">
        <div>
          <h1 class="title st__title">{{ data.title }}</h1>
          <p class="st__updated num">{{ t(data.updated, { time: fmt.date(updated, { hour: '2-digit', minute: '2-digit' }) }) }}</p>
        </div>
        <ZButton variant="ghost" @click="subscribing = true; emailError = ''"><ZIcon name="bell" :size="14" /> {{ data.subscribe.cta }}</ZButton>
      </header>

      <section class="st__banner" :class="`is-${worst}`" role="status">
        <ZIcon :name="icons[worst]" :size="22" />
        <div>
          <h2>{{ data.overall[worst] }}</h2>
          <p>{{ data.overallText[worst] }}</p>
        </div>
      </section>

      <section class="st__maint z-panel" aria-labelledby="st-maint">
        <span class="st__maint-icon"><ZIcon name="clock" :size="18" /></span>
        <div>
          <h2 id="st-maint">{{ data.maintenance.title }}</h2>
          <p class="st__maint-when num">{{ data.maintenance.when }}</p>
          <p>{{ data.maintenance.text }}</p>
        </div>
      </section>

      <section class="st__groups" aria-labelledby="st-components">
        <div class="st__sec-head">
          <h2 id="st-components">{{ data.components.title }}</h2>
          <ul class="st__legend" :aria-label="data.legend">
            <li v-for="lv in ['operational', 'degraded', 'partial', 'major', 'maintenance']" :key="lv"><span :class="`is-${lv}`" /> {{ data.levels[lv] }}</li>
          </ul>
        </div>
        <div v-for="g in groups" :key="g.group" class="st__group z-panel">
          <button type="button" class="st__group-head" :aria-expanded="open[g.group]" :aria-controls="`st-g-${g.group}`" @click="open[g.group] = !open[g.group]">
            <ZIcon name="chevron" :size="16" class="st__chev" />
            <span>{{ data.components.groups[g.group] }}</span>
            <span class="st__pill" :class="`is-${worstOf(g.items)}`"><ZIcon :name="icons[worstOf(g.items)]" :size="12" /> {{ data.levels[worstOf(g.items)] }}</span>
          </button>
          <ul v-show="open[g.group]" :id="`st-g-${g.group}`" class="st__items">
            <li v-for="c in g.items" :key="c.id" class="st__comp">
              <div class="st__comp-head">
                <h3>{{ data.components.items[c.id] }}</h3>
                <span class="st__state" :class="`is-${c.status}`"><ZIcon :name="icons[c.status]" :size="13" /> {{ data.levels[c.status] }}</span>
              </div>
              <div class="st__bars" role="img" :aria-label="t(data.components.uptimeLabel, { name: data.components.items[c.id], pct: fmt.num(c.uptime, 2) })">
                <span
                  v-for="(d, i) in c.days"
                  :key="i"
                  class="st__bar"
                  :class="[`is-${d}`, { 'is-old': i < DAYS - 30 }]"
                  @pointerenter="showTip($event, c, i)"
                  @pointerleave="tip = null"
                />
              </div>
              <div class="st__scale num">
                <span class="st__ago-90">{{ t(data.components.ago, { n: DAYS }) }}</span>
                <span class="st__ago-30">{{ t(data.components.ago, { n: 30 }) }}</span>
                <span>{{ t(data.components.uptime, { pct: fmt.num(c.uptime, 2) }) }}</span>
                <span>{{ data.components.today }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="st__history" aria-labelledby="st-history">
        <h2 id="st-history">{{ data.history.title }}</h2>
        <article v-for="inc in data.history.items" :key="inc.id" class="st__inc">
          <p class="st__inc-date">{{ incidentDate(inc.ago) }}</p>
          <div class="st__inc-body z-panel">
            <h3>
              <span class="st__pill" :class="`is-${inc.level}`"><ZIcon :name="icons[inc.level]" :size="12" /> {{ data.levels[inc.level] }}</span>
              {{ inc.title }}
            </h3>
            <p class="st__inc-affects">{{ t(data.history.affects, { list: inc.affects.map((a) => data.components.items[a]).join(', ') }) }}</p>
            <ol class="st__timeline">
              <li v-for="u in inc.updates" :key="u.stage + u.time">
                <strong>{{ data.history.stages[u.stage] }}</strong>
                <p>{{ u.text }}</p>
                <time class="num">{{ u.time }}</time>
              </li>
            </ol>
          </div>
        </article>
        <p class="st__none">{{ data.history.quiet }}</p>
      </section>

      <p class="st__demo">{{ data.demo }}</p>
    </div>

    <div v-if="tip" class="st__tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" aria-hidden="true">{{ tip.text }}</div>

    <ZDialog v-if="subscribing" :title="data.subscribe.title" :close-label="data.subscribe.close" size="sm" @close="subscribing = false">
      <p class="st__dlg">{{ data.subscribe.text }}</p>
      <label class="z-label" for="st-email">{{ data.subscribe.label }}</label>
      <input id="st-email" v-model="email" class="z-input" type="email" autocomplete="email" :placeholder="i18n.content.auth.identifier.emailPlaceholder" :aria-invalid="!!emailError" @keydown.enter.prevent="subscribe" />
      <p v-if="emailError" class="z-error">{{ emailError }}</p>
      <template #footer>
        <ZButton variant="ghost" @click="subscribing = false">{{ data.subscribe.close }}</ZButton>
        <ZButton @click="subscribe">{{ data.subscribe.submit }}</ZButton>
      </template>
    </ZDialog>
  </SiteLayout>
</template>

<style scoped>
.st { max-width: 960px; }
.st__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.st__title { font-size: clamp(30px, 3.4vw, 44px); }
.st__updated { margin-top: 8px; font-size: 13px; color: var(--color-text-muted); }
.st__banner { --tone: var(--color-state-up); display: flex; align-items: center; gap: 16px; margin-top: 28px; padding: 22px 24px; border-radius: var(--radius-lg); color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, var(--color-bg-surface)); border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent); }
.st__banner h2 { font-size: 18px; font-weight: var(--font-weight-semibold); color: var(--color-text-default); }
.st__banner p { margin-top: 2px; font-size: 13px; color: var(--color-text-muted); }
.is-degraded { --tone: var(--color-state-warn); }
.is-partial { --tone: color-mix(in srgb, var(--color-state-warn) 50%, var(--color-state-down)); }
.is-major { --tone: var(--color-state-down); }
.is-maintenance { --tone: var(--color-brand-secondary-300); }
.is-operational { --tone: var(--color-state-up); }
.st__maint { display: flex; gap: 14px; margin-top: 16px; padding: 18px 20px; }
.st__maint-icon { display: grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 50%; color: var(--color-brand-secondary-300); background: color-mix(in srgb, var(--color-brand-secondary) 20%, transparent); }
.st__maint h2 { font-size: 15px; font-weight: var(--font-weight-semibold); }
.st__maint-when { margin-top: 2px; font-size: 12.5px; color: var(--color-brand-secondary-300); }
.st__maint p:last-child { margin-top: 6px; font-size: 13px; color: var(--color-text-muted); }
.st__groups, .st__history { margin-top: 44px; }
.st__sec-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.st__sec-head h2, .st__history > h2 { font-size: var(--font-size-h3); font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.st__legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--color-text-muted); }
.st__legend li { display: flex; align-items: center; gap: 6px; }
.st__legend span { width: 10px; height: 10px; border-radius: 3px; background: var(--tone); }
.st__group { margin-bottom: 12px; overflow: hidden; }
.st__group-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 16px 20px; text-align: left; font-size: 15px; font-weight: var(--font-weight-semibold); }
.st__group-head:hover { background: var(--fill-1); }
.st__chev { color: var(--color-text-muted); transition: transform var(--duration-panel) var(--motion-ease-out); }
.st__group-head[aria-expanded='false'] .st__chev { transform: rotate(-90deg); }
.st__group-head .st__pill { margin-left: auto; }
.st__pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: var(--radius-pill); font-size: 11.5px; font-weight: var(--font-weight-medium); color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); white-space: nowrap; }
.st__items { border-top: 1px solid var(--color-line-default); }
.st__comp { padding: 16px 20px; }
.st__comp + .st__comp { border-top: 1px solid var(--color-line-default); }
.st__comp-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.st__comp-head h3 { font-size: 14px; font-weight: var(--font-weight-medium); }
.st__state { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--tone); }
.st__bars { display: flex; gap: 2px; height: 30px; margin-top: 12px; }
.st__bar { flex: 1; min-width: 2px; border-radius: 2px; background: var(--tone); opacity: 0.85; transition: opacity 120ms, transform 120ms; }
.st__bar.is-operational { opacity: 0.55; }
.st__bar:hover { opacity: 1; transform: scaleY(1.12); }
.st__scale { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11.5px; color: var(--color-text-dim); }
.st__tip { position: fixed; z-index: 120; transform: translate(-50%, calc(-100% - 8px)); padding: 6px 10px; border-radius: var(--radius-sm); background: var(--color-bg-surface-2); border: 1px solid var(--color-line-strong); font-size: 12px; white-space: nowrap; pointer-events: none; box-shadow: 0 10px 30px -10px var(--ink); }
.st__inc { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 20px; margin-top: 18px; }
.st__inc-date { padding-top: 18px; font-size: 13px; color: var(--color-text-muted); }
.st__inc-body { padding: 18px 20px; }
.st__inc-body h3 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 15px; font-weight: var(--font-weight-semibold); }
.st__inc-affects { margin-top: 6px; font-size: 12.5px; color: var(--color-text-dim); }
.st__timeline { display: grid; gap: 14px; margin-top: 16px; padding-left: 14px; border-left: 1px solid var(--color-line-strong); }
.st__timeline strong { font-size: 13px; font-weight: var(--font-weight-semibold); }
.st__timeline p { margin-top: 2px; font-size: 13px; color: var(--color-text-muted); }
.st__timeline time { font-size: 11.5px; color: var(--color-text-dim); }
.st__none { margin-top: 18px; font-size: 13px; color: var(--color-text-dim); }
.st__ago-30 { display: none; }
.st__demo { margin-top: 40px; font-size: 12px; color: var(--color-text-dim); }
.st__dlg { margin-bottom: 16px; font-size: 14px; color: var(--color-text-muted); }
@media (max-width: 760px) {
  .st__bar.is-old, .st__ago-90 { display: none; }
  .st__ago-30 { display: inline; }
  .st__inc { grid-template-columns: 1fr; gap: 6px; }
  .st__inc-date { padding-top: 0; }
  .st__group-head .st__pill { display: none; }
}
</style>
