<script setup>
import ZLogo from '../ui/ZLogo.vue';

// Téléphone en code. `image` (capture réelle) remplace l'écran dessiné :
// { avif, webp, src, width, height, alt }.
defineProps({
  screen: { type: Object, default: null },
  brand: { type: String, default: '' },
  image: { type: Object, default: null },
  variant: { type: String, default: 'upright' }, // upright | lying
});
</script>

<template>
  <picture v-if="image" class="phone-img">
    <source v-if="image.avif" :srcset="image.avif" type="image/avif" />
    <source v-if="image.webp" :srcset="image.webp" type="image/webp" />
    <img :src="image.src" :alt="image.alt" :width="image.width" :height="image.height" loading="lazy" decoding="async" />
  </picture>

  <!-- Variante couchée : silhouette simplifiée (section Mobile Money). -->
  <div v-else-if="variant === 'lying'" class="slab" aria-hidden="true">
    <span /><span /><span /><i />
  </div>

  <div v-else class="phone" role="img" :aria-label="screen.label">
    <div class="phone__screen" aria-hidden="true">
      <span class="phone__island" />
      <div class="phone__top">
        <ZLogo :brand="brand" :size="14" />
        <span>{{ screen.tag }}</span>
      </div>
      <p class="phone__title" v-html="screen.title" />
      <div v-for="field in screen.fields" :key="field.label" class="phone__field">
        <span class="phone__label">{{ field.label }}</span>
        <span class="phone__value">{{ field.value }}</span>
        <span class="phone__unit"><i />{{ field.unit }}</span>
      </div>
      <div class="phone__methods">
        <span v-for="(m, i) in screen.methods" :key="m" :class="{ 'is-on': i === 0 }">{{ m }}</span>
      </div>
      <span class="phone__cta">{{ screen.cta }}</span>
      <div class="phone__ticker">
        <span>{{ screen.ticker.label }}</span><span class="up">{{ screen.ticker.change }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-img img { width: 100%; height: auto; }
.phone {
  text-align: left; width: 270px; aspect-ratio: 270 / 560; padding: 9px; border-radius: 46px;
  background: var(--color-bg-base); border: 1px solid var(--color-line-strong);
  box-shadow: 0 40px 90px -30px var(--ink), inset 0 0 0 2px var(--color-bg-surface-2);
}
.phone__screen { position: relative; height: 100%; padding: 58px 16px 16px; border-radius: 38px; background: var(--color-bg-surface-2); overflow: hidden; display: flex; flex-direction: column; gap: 9px; }
.phone__island { position: absolute; top: 14px; left: 50%; width: 84px; height: 24px; margin-left: -42px; border-radius: var(--radius-pill); background: var(--color-bg-base); }
.phone__top { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--color-text-muted); }
.phone__title { font-size: 21px; font-weight: var(--font-weight-semibold); letter-spacing: -0.03em; line-height: 1.05; margin: 6px 0 4px; }
.phone__field { position: relative; display: grid; gap: 6px; padding: 12px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-default); }
.phone__label { font-size: 10.5px; color: var(--color-text-muted); }
.phone__value { font-size: 19px; font-weight: var(--font-weight-semibold); letter-spacing: -0.02em; line-height: 1; }
.phone__unit { position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: var(--radius-pill); background: var(--fill-2); font-size: 11px; }
.phone__unit i { width: 12px; height: 12px; border-radius: 50%; background: var(--color-state-up); }
.phone__methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.phone__methods span { display: grid; place-items: center; min-height: 40px; padding: 4px; border-radius: var(--radius-md); background: var(--fill-1); border: 1px solid var(--color-line-default); font-size: 10px; text-align: center; line-height: 1.2; color: var(--color-text-muted); }
.phone__methods .is-on { color: var(--color-text-default); border-color: var(--color-brand-primary-300); background: color-mix(in srgb, var(--color-brand-primary) 35%, transparent); }
.phone__cta { display: grid; place-items: center; height: 40px; border-radius: var(--radius-md); background: var(--gradient-brand); font-size: 13px; font-weight: var(--font-weight-semibold); }
.phone__ticker { display: flex; justify-content: space-between; margin-top: auto; font-size: 11px; color: var(--color-text-muted); }
.up { color: var(--color-state-up); }

.slab {
  position: relative; width: 324px; height: 110px; padding: 12px 34px; border-radius: 26px; display: grid; gap: 6px; align-content: start;
  background: linear-gradient(var(--color-bg-surface-2), var(--color-bg-surface)); border: 1px solid var(--color-line-strong);
  box-shadow: 0 50px 80px -30px var(--ink);
}
.slab span { height: 4px; border-radius: var(--radius-pill); background: var(--fill-2); }
.slab span:nth-child(2) { width: 60%; }
.slab span:nth-child(3) { width: 82%; }
.slab i { position: absolute; left: 22px; bottom: 12px; width: 124px; height: 14px; border-radius: var(--radius-pill); background: var(--gradient-brand); }
</style>
