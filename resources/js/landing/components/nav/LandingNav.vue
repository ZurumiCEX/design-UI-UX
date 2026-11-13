<script setup>
import { ref } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { useScrollFrame } from '../../composables/useScrollProgress.js';
import ZButton from '../ui/ZButton.vue';
import ZIcon from '../ui/ZIcon.vue';
import ZLogo from '../ui/ZLogo.vue';
import DownloadPopover from './DownloadPopover.vue';
import LangSwitcher from './LangSwitcher.vue';
import NavDropdown from './NavDropdown.vue';

defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
  page: { type: String, default: '' }, // page courante : son entrée de menu porte aria-current
  solid: { type: Boolean, default: false }, // barre opaque en permanence
});

const { i18n, setLocale } = useI18n();
const scrolled = ref(false);
const open = ref(false);
useScrollFrame((y) => (scrolled.value = y > 20)); // A8
</script>

<template>
  <header class="nav" :class="{ 'nav--scrolled': scrolled, 'nav--open': open, 'nav--solid': solid }" @keydown.esc="open = false">
    <div class="nav__blur" aria-hidden="true" />
    <div class="nav__bar">
      <a class="nav__in" :href="common.links.home" :aria-label="data.home" style="--n: 0">
        <ZLogo :brand="common.brand" />
      </a>

      <nav class="nav__menu" :aria-label="data.label">
        <ul>
          <li v-for="(item, i) in data.items" :key="item.label" class="nav__in" :style="{ '--n': i + 1 }">
            <NavDropdown v-if="item.children" :item="item" :page="page" />
            <a
              v-else
              class="nav__link label"
              :class="{ 'is-current': item.page && item.page === page }"
              :href="item.href"
              :aria-current="item.page && item.page === page ? 'page' : undefined"
            >{{ item.label }}<span v-if="item.badge" class="nav__badge">{{ item.badge }}</span></a>
          </li>
        </ul>
      </nav>

      <div class="nav__right">
        <a class="nav__link nav__tool nav__search label nav__in" :href="common.links.search" :style="{ '--n': data.items.length + 1 }">
          <ZIcon name="search" :size="14" /> {{ data.search }}
        </a>
        <LangSwitcher class="nav__tool nav__lang nav__in" :style="{ '--n': data.items.length + 2 }" />
        <DownloadPopover class="nav__in" :download="common.download" :stores="common.stores" :style="{ '--n': data.items.length + 3 }" />
        <ZButton class="nav__in nav__login" variant="ghost" :href="common.links.login" :style="{ '--n': data.items.length + 4 }">{{ data.login }}</ZButton>
        <ZButton class="nav__in" :href="common.links.signup" :style="{ '--n': data.items.length + 5 }">{{ data.signup }}</ZButton>
        <button
          type="button"
          class="nav__burger"
          :aria-label="open ? data.menu.close : data.menu.open"
          :aria-expanded="open"
          aria-controls="nav-panel"
          @click="open = !open"
        >
          <ZIcon :name="open ? 'close' : 'menu'" :size="20" />
        </button>
      </div>
    </div>

    <!-- Panneau mobile : le sous-menu Transactions est déplié. -->
    <nav id="nav-panel" class="nav__panel" :aria-label="data.label" :hidden="!open">
      <ul>
        <template v-for="item in data.items" :key="item.label">
          <li v-if="!item.children">
            <a :href="item.href" :aria-current="item.page && item.page === page ? 'page' : undefined" @click="open = false">{{ item.label }}<span v-if="item.badge" class="nav__badge">{{ item.badge }}</span></a>
          </li>
          <li v-else>
            <span class="nav__group label">{{ item.label }}</span>
            <ul>
              <li v-for="child in item.children" :key="child.label">
                <a :href="child.href" :aria-current="child.page && child.page === page ? 'page' : undefined" @click="open = false"><ZIcon :name="child.icon" :size="16" /> {{ child.label }}</a>
              </li>
            </ul>
          </li>
        </template>
      </ul>
      <div class="nav__langs" role="group" :aria-label="data.language.label">
        <button
          v-for="lang in common.languages"
          :key="lang.code"
          type="button"
          class="nav__lang-btn"
          :lang="lang.code"
          :aria-pressed="lang.code === i18n.locale"
          @click="setLocale(lang.code)"
        >
          <span class="label">{{ lang.code }}</span> {{ lang.label }}
        </button>
      </div>
      <ZButton variant="ghost" size="lg" :href="common.links.login">{{ data.login }}</ZButton>
    </nav>
  </header>
</template>

<style scoped>
.nav { position: fixed; inset: 0 0 auto; z-index: 50; }
/* A8 — flou progressif : le contenu passe dessous en se floutant. */
.nav__blur {
  position: absolute; inset: 0 0 -28px; pointer-events: none;
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  background: linear-gradient(color-mix(in srgb, var(--color-bg-base) 88%, transparent), color-mix(in srgb, var(--color-bg-base) 62%, transparent) 60%, transparent);
  mask-image: linear-gradient(#000 55%, transparent); -webkit-mask-image: linear-gradient(#000 55%, transparent);
  opacity: 0; transition: opacity var(--motion-duration-hover);
}
.nav--scrolled .nav__blur, .nav--open .nav__blur { opacity: 1; }
/* Barre opaque : pages applicatives (Trade). */
.nav--solid .nav__blur {
  inset: 0; opacity: 1; mask-image: none; -webkit-mask-image: none;
  background: color-mix(in srgb, var(--color-bg-base) 92%, transparent); border-bottom: 1px solid var(--color-line-default);
}
.nav__bar { position: relative; display: flex; align-items: center; gap: 38px; height: var(--space-nav-height); padding: 0 64px; }
.nav__menu ul { display: flex; align-items: center; gap: 24px; }
.nav__link { position: relative; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; height: var(--space-nav-height); color: var(--color-text-muted); transition: color var(--motion-duration-hover); }
.nav__link:hover, .nav__link.is-current { color: var(--color-text-default); }
.nav__link.is-current::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: 12px; height: 1px; background: var(--gradient-brand-soft);
}
.nav__badge { margin-left: 2px; padding: 1px 5px; border-radius: 4px; font-size: 9px; letter-spacing: 0.06em; color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 30%, transparent); }
.nav__right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.nav__tool { margin-right: 18px; }
.nav__burger { display: none; width: 36px; height: 36px; place-items: center; }

/* A3 — les éléments du menu apparaissent un à un, de gauche à droite. */
:global(.js .nav__in) { opacity: 0; transform: translateY(-6px); }
:global(.js.ready .nav__in) {
  opacity: 1; transform: none;
  transition: opacity var(--duration-block) var(--motion-ease-out), transform var(--duration-block) var(--motion-ease-out);
  transition-delay: calc(var(--seq-nav) + var(--n) * var(--seq-nav-step));
}
:global(.js.settled .nav__in) { transition-delay: 0s; }

.nav__panel { display: none; }

/* Écrans intermédiaires : on resserre, puis on retire la recherche. */
@media (max-width: 1360px) {
  .nav__bar { padding: 0 var(--space-gutter); gap: 26px; }
  .nav__menu ul { gap: 18px; }
  .nav__tool { margin-right: 8px; }
  .nav__search { display: none; }
}
/* Le menu compte six entrées : il passe en panneau dès 1180 px pour ne jamais déborder. */
@media (max-width: 1180px) {
  .nav__bar { padding: 0 var(--space-gutter-mobile); gap: 12px; }
  .nav__menu, .nav__tool, .nav__login { display: none; }
  .nav__burger { display: grid; }
  .nav__panel:not([hidden]) {
    position: relative; display: grid; align-content: start; gap: 22px; padding: 12px var(--space-gutter-mobile) 28px;
    min-height: calc(100dvh - var(--space-nav-height));
    background: var(--color-bg-base); border-bottom: 1px solid var(--color-line-default);
    max-height: calc(100dvh - var(--space-nav-height)); overflow-y: auto;
  }
  .nav__panel li a { display: flex; align-items: center; gap: 10px; padding: 12px 0; font-size: 17px; font-weight: var(--font-weight-medium); }
  .nav__panel li a[aria-current] { color: var(--color-brand-primary-300); }
  .nav__panel ul ul { padding-left: 4px; border-left: 1px solid var(--color-line-default); margin-left: 4px; }
  .nav__panel ul ul a { padding-left: 14px; color: var(--color-text-muted); }
  .nav__group { display: block; padding: 14px 0 8px; color: var(--color-text-dim); }
  .nav__langs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .nav__lang-btn {
    display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: var(--radius-sm);
    background: var(--color-bg-surface); border: 1px solid var(--color-line-default); font-size: 14px;
  }
  .nav__lang-btn .label { color: var(--color-text-muted); }
  .nav__lang-btn[aria-pressed='true'] { border-color: var(--color-brand-primary-300); }
  .nav__lang-btn[aria-pressed='true'] .label { color: var(--color-brand-primary-300); }
}
@media (prefers-reduced-motion: reduce) {
  :global(.js .nav__in) { opacity: 1; transform: none; }
}
</style>
