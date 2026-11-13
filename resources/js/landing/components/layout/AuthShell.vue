<script setup>
import { useI18n } from '../../composables/useI18n.js';
import LangSwitcher from '../nav/LangSwitcher.vue';
import ZLogo from '../ui/ZLogo.vue';
import StarField from '../visuals/StarField.vue';
import SvgDefs from './SvgDefs.vue';

// Gabarit des pages de connexion / inscription : visuel à gauche, formulaire à droite.
const { i18n } = useI18n();
</script>

<template>
  <SvgDefs />
  <div class="auth">
    <aside class="auth__visual">
      <StarField />
      <div class="auth__glow" aria-hidden="true" />
      <slot name="visual" />
    </aside>

    <div class="auth__side">
      <header class="auth__top">
        <a :href="i18n.content.common.links.home" :aria-label="i18n.content.nav.home"><ZLogo :brand="i18n.content.common.brand" variant="full" :size="46" /></a>
        <LangSwitcher />
      </header>
      <main class="auth__main">
        <div class="auth__form">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); min-height: 100svh; }
.auth__visual { position: relative; overflow: hidden; background: var(--color-bg-base); border-right: 1px solid var(--color-line-default); }
.auth__glow {
  position: absolute; left: 50%; top: 56%; width: 120%; aspect-ratio: 1; transform: translate(-50%, -50%); pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-primary) 42%, transparent), color-mix(in srgb, var(--color-brand-secondary) 12%, transparent) 55%, transparent);
}
.auth__side { display: flex; flex-direction: column; background: var(--color-bg-surface); }
.auth__top { display: flex; justify-content: space-between; align-items: center; height: 72px; padding: 0 40px; }
.auth__main { flex: 1; display: grid; place-items: center; padding: 24px 40px 64px; }
.auth__form { width: min(400px, 100%); }
@media (max-width: 900px) {
  .auth { grid-template-columns: 1fr; }
  .auth__visual { display: none; }
  .auth__top { padding: 0 var(--space-gutter-mobile); height: var(--space-nav-height); }
  .auth__main { place-items: start center; padding: 24px var(--space-gutter-mobile) 48px; }
}
</style>
