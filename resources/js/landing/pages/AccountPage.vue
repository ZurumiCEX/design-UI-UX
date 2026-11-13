<script setup>
import { computed } from 'vue';
import { USD_XOF } from '../content/data.js';
import { useI18n } from '../composables/useI18n.js';
import { useMarketFeed } from '../composables/useMarketFeed.js';
import { useNotifications } from '../composables/useNotifications.js';
import { useProfile } from '../composables/useProfile.js';
import { useSecurityScore } from '../composables/useSecurityScore.js';
import { useWallet } from '../composables/useWallet.js';
import { tradeHref } from '../market/links.js';
import { toast } from '../composables/useToast.js';
import AccountLayout from '../components/account/AccountLayout.vue';
import SecurityScore from '../components/account/SecurityScore.vue';
import ZAvatar from '../components/ui/ZAvatar.vue';
import ZButton from '../components/ui/ZButton.vue';
import ZCoinIcon from '../components/ui/ZCoinIcon.vue';
import ZIcon from '../components/ui/ZIcon.vue';
import Sparkline from '../components/visuals/Sparkline.vue';

const { i18n, fmt, t } = useI18n();
const { profile, prefs, initials } = useProfile();
const feed = useMarketFeed();
const { balances } = useWallet();
const { score, missing } = useSecurityScore(profile);
const { items: notes } = useNotifications();
const data = computed(() => i18n.content.pages.account);
const links = computed(() => i18n.content.common.links);

const total = computed(() => feed.coins.reduce((s, c) => s + (balances[c.id] ?? 0) * c.price, 0));
const money = (xof) => (prefs.currency === 'USD' ? `${fmt.num(xof / USD_XOF, 2)} USD` : fmt.xof(xof));
const tasks = computed(() => [
  { key: 'kyc', done: profile.kyc.level >= 1, href: links.value.kyc },
  { key: 'deposit', done: total.value > 0, href: links.value.receive },
  { key: 'trade', done: false, href: links.value.quickBuy },
]);
const doneCount = computed(() => tasks.value.filter((x) => x.done).length);
const market = computed(() => feed.coins.filter((c) => c.category !== 'stable').slice(0, 5));

async function copyUid() {
  try {
    await navigator.clipboard.writeText(profile.uid);
  } catch {
    /* presse-papiers indisponible */
  }
  toast(data.value.copied, { tone: 'success' });
}
</script>

<template>
  <AccountLayout page="account" :title="data.title">
    <section class="db__hello">
      <ZAvatar :src="profile.avatar ?? ''" :initials="initials()" :size="56" />
      <div>
        <p class="db__greet">{{ t(data.greeting, { name: profile.firstName }) }}</p>
        <button type="button" class="db__uid num" @click="copyUid">UID {{ profile.uid }} <ZIcon name="copy" :size="13" /><span class="sr-only">{{ data.copyUid }}</span></button>
      </div>
      <dl class="db__chips">
        <a :href="links.kyc">
          <dt>{{ data.chips.kyc }}</dt>
          <dd :class="profile.kyc.level ? 'is-up' : 'is-warn'"><ZIcon :name="profile.kyc.level ? 'check' : 'alert'" :size="13" /> {{ t(data.chips.level, { n: profile.kyc.level }) }}</dd>
        </a>
        <a :href="links.accountSecurity">
          <dt>{{ data.chips.security }}</dt>
          <dd :class="score >= 80 ? 'is-up' : 'is-warn'"><ZIcon :name="score >= 80 ? 'check' : 'alert'" :size="13" /> <span class="num">{{ score }}/100</span></dd>
        </a>
        <a :href="links.accountSecurity">
          <dt>{{ data.chips.totp }}</dt>
          <dd :class="profile.security.totp ? 'is-up' : 'is-warn'"><ZIcon :name="profile.security.totp ? 'check' : 'alert'" :size="13" /> {{ profile.security.totp ? data.on : data.off }}</dd>
        </a>
      </dl>
    </section>

    <div class="db__grid">
      <div class="db__col">
        <section class="db__card z-panel" aria-labelledby="db-tasks">
          <h2 id="db-tasks">{{ data.tasks.title }} <span class="num">({{ doneCount }}/{{ tasks.length }})</span></h2>
          <ol class="db__tasks">
            <li v-for="(task, i) in tasks" :key="task.key" :class="{ 'is-done': task.done, 'is-next': !task.done && tasks.slice(0, i).every((x) => x.done) }">
              <span class="label">{{ t(data.tasks.step, { n: i + 1 }) }}</span>
              <h3>{{ data.tasks.items[task.key].title }}</h3>
              <p>{{ data.tasks.items[task.key].text }}</p>
              <span v-if="task.done" class="db__done"><ZIcon name="check" :size="14" /> {{ data.tasks.done }}</span>
              <ZButton v-else size="md" :variant="tasks.slice(0, i).every((x) => x.done) ? 'primary' : 'ghost'" :href="task.href">{{ data.tasks.items[task.key].cta }}</ZButton>
            </li>
          </ol>
        </section>

        <section class="db__card z-panel" aria-labelledby="db-assets">
          <div class="db__row">
            <h2 id="db-assets">{{ data.assets.title }}</h2>
            <button type="button" class="db__eye" :aria-pressed="prefs.hideBalance" :aria-label="prefs.hideBalance ? data.assets.show : data.assets.hide" @click="prefs.hideBalance = !prefs.hideBalance">
              <ZIcon :name="prefs.hideBalance ? 'eye-off' : 'eye'" :size="16" />
            </button>
            <a class="db__link" :href="links.wallet">{{ data.assets.overview }} <ZIcon name="arrow-right" :size="13" /></a>
          </div>
          <p class="db__total num">{{ prefs.hideBalance ? '••••••' : money(total) }}</p>
          <div class="db__btns">
            <ZButton :href="links.receive">{{ data.assets.deposit }}</ZButton>
            <ZButton variant="ghost" :href="links.quickBuy">{{ data.assets.buy }}</ZButton>
            <ZButton variant="ghost" :href="links.withdraw">{{ data.assets.withdraw }}</ZButton>
          </div>
        </section>

        <section class="db__card z-panel" aria-labelledby="db-market">
          <div class="db__row">
            <h2 id="db-market">{{ data.market.title }}</h2>
            <a class="db__link" :href="links.markets">{{ data.market.more }} <ZIcon name="arrow-right" :size="13" /></a>
          </div>
          <table class="db__market">
            <caption class="sr-only">{{ data.market.title }}</caption>
            <thead><tr><th scope="col">{{ data.market.pair }}</th><th scope="col">{{ data.market.price }}</th><th scope="col">{{ data.market.change }}</th><th scope="col" class="c-spark"><span class="sr-only">{{ data.market.trend }}</span></th><th scope="col"><span class="sr-only">{{ data.market.action }}</span></th></tr></thead>
            <tbody>
              <tr v-for="c in market" :key="c.id">
                <th scope="row"><span class="db__coin"><ZCoinIcon :glyph="c.glyph" :tone="c.tone" :size="22" /> {{ c.ticker }}</span></th>
                <td class="num">{{ fmt.xof(c.price) }}</td>
                <td class="num" :class="c.change['24h'] >= 0 ? 'is-up' : 'is-down'">{{ fmt.pct(c.change['24h']) }}</td>
                <td class="c-spark"><Sparkline :values="c.spark" :up="c.change['24h'] >= 0" :width="80" :height="26" /></td>
                <td><a :href="tradeHref(links, c) ?? links.quickBuy">{{ data.market.trade }}</a></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <aside class="db__col">
        <section class="db__card z-panel db__sec" aria-labelledby="db-sec">
          <h2 id="db-sec">{{ data.security.title }}</h2>
          <div class="db__score">
            <SecurityScore :score="score" :label="data.security.title" />
            <p>{{ score >= 80 ? data.security.good : data.security.improve }}</p>
          </div>
          <ul class="db__todo">
            <li v-for="k in missing" :key="k"><ZIcon name="alert" :size="14" /> {{ data.security.missing[k] }}</li>
          </ul>
          <ZButton variant="ghost" :href="links.accountSecurity">{{ data.security.cta }}</ZButton>
        </section>

        <section class="db__card z-panel" aria-labelledby="db-kyc">
          <h2 id="db-kyc">{{ data.kyc.title }}</h2>
          <p class="db__muted">{{ t(data.kyc.text, { n: profile.kyc.level }) }}</p>
          <ZButton v-if="profile.kyc.level < 2" :href="links.kyc">{{ data.kyc.cta }}</ZButton>
        </section>

        <section class="db__card z-panel" aria-labelledby="db-notes">
          <h2 id="db-notes">{{ data.notifications }}</h2>
          <ul class="db__notes">
            <li v-for="n in notes.slice(0, 3)" :key="n.id" :class="{ 'is-unread': !n.read }">
              <strong>{{ n.title }}</strong>
              <span>{{ fmt.ago(n.ago) }}</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </AccountLayout>
</template>

<style scoped>
.db__hello { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 24px; padding-bottom: 28px; border-bottom: 1px solid var(--color-line-default); }
.db__greet { font-size: 19px; font-weight: var(--font-weight-semibold); }
.db__uid { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-muted); }
.db__uid:hover { color: var(--color-text-default); }
.db__chips { display: flex; flex-wrap: wrap; gap: 28px; margin: 0 0 0 auto; padding-left: 28px; border-left: 1px solid var(--color-line-default); }
.db__chips a { display: grid; gap: 4px; }
.db__chips dt { font-size: 12px; color: var(--color-text-muted); }
.db__chips dd { display: inline-flex; align-items: center; gap: 6px; margin: 0; font-size: 13px; font-weight: var(--font-weight-semibold); }
.is-warn { color: var(--color-state-warn); }
.db__grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; margin-top: 28px; }
.db__col { display: grid; gap: 20px; align-content: start; min-width: 0; }
.db__card { padding: 24px; }
.db__card h2 { font-size: 16px; font-weight: var(--font-weight-semibold); }
.db__row { display: flex; align-items: center; gap: 10px; }
.db__link { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-brand-primary-300); }
.db__link:hover { color: var(--color-text-default); }
.db__eye { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--color-text-muted); }
.db__eye:hover { background: var(--fill-2); color: var(--color-text-default); }
.db__tasks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
.db__tasks li { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-height: 170px; padding: 18px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); border: 1px solid transparent; }
.db__tasks li.is-next { border-color: color-mix(in srgb, var(--color-brand-primary-300) 40%, transparent); background: color-mix(in srgb, var(--color-brand-primary) 16%, var(--color-bg-surface-2)); }
.db__tasks .label { color: var(--color-text-dim); }
.db__tasks h3 { font-size: 15px; font-weight: var(--font-weight-semibold); }
.db__tasks p { flex: 1; font-size: 12.5px; color: var(--color-text-muted); }
.db__done { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-state-up); }
.db__total { margin: 14px 0 18px; font-size: 32px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; }
.db__btns { display: flex; flex-wrap: wrap; gap: 8px; }
.db__market { width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 13.5px; }
.db__market thead th { padding: 8px; font-size: 12px; font-weight: var(--font-weight-medium); color: var(--color-text-muted); text-align: right; background: var(--color-bg-surface-2); }
.db__market thead th:first-child { text-align: left; border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.db__market thead th:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.db__market td, .db__market tbody th { height: 52px; padding: 0 8px; text-align: right; border-bottom: 1px solid var(--color-line-default); font-weight: var(--font-weight-medium); }
.db__market tbody th { text-align: left; }
.db__coin { display: inline-flex; align-items: center; gap: 10px; }
.db__market .spark { margin-left: auto; }
.db__market a { color: var(--color-brand-primary-300); }
.db__score { display: flex; align-items: center; gap: 16px; margin: 16px 0; }
.db__score p, .db__muted { font-size: 13px; color: var(--color-text-muted); }
.db__muted { margin: 8px 0 16px; }
.db__todo { display: grid; gap: 8px; margin-bottom: 16px; font-size: 13px; }
.db__todo li { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); }
.db__todo :deep(svg) { color: var(--color-state-warn); }
.db__notes { display: grid; gap: 10px; margin-top: 12px; }
.db__notes li { display: grid; gap: 2px; padding-left: 12px; border-left: 2px solid var(--color-line-default); font-size: 13px; }
.db__notes li.is-unread { border-color: var(--color-brand-primary-300); }
.db__notes span { font-size: 12px; color: var(--color-text-dim); }
@media (max-width: 1200px) { .db__grid { grid-template-columns: minmax(0, 1fr); } .db__chips { margin-left: 0; padding-left: 0; border-left: 0; width: 100%; } }
@media (max-width: 760px) { .db__tasks { grid-template-columns: 1fr; } .db__tasks li { min-height: 0; } .c-spark { display: none; } }
</style>
