<script setup>
import { computed } from 'vue';

const props = defineProps({
  href: { type: String, default: '' },
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | light | pill
  size: { type: String, default: 'md' }, // md | lg
  type: { type: String, default: 'button' },
});
const tag = computed(() => (props.href ? 'a' : 'button'));
</script>

<template>
  <component
    :is="tag"
    :href="href || undefined"
    :type="href ? undefined : type"
    class="z-btn"
    :class="[`z-btn--${variant}`, `z-btn--${size}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.z-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 36px; padding: 0 16px; border-radius: var(--radius-sm);
  font-size: var(--font-size-label); font-weight: var(--font-weight-semibold);
  letter-spacing: var(--font-tracking-label); text-transform: uppercase; white-space: nowrap;
  border: 1px solid transparent;
  transition: transform var(--motion-duration-hover) var(--motion-ease-out),
    box-shadow var(--motion-duration-hover) var(--motion-ease-out),
    background-color var(--motion-duration-hover), border-color var(--motion-duration-hover);
}
.z-btn--lg { height: 42px; padding: 0 20px; }
.z-btn--primary, .z-btn--pill {
  background: var(--gradient-brand); color: var(--color-text-default);
  box-shadow: 0 6px 24px -10px var(--glow-brand), inset 0 1px 0 var(--color-line-strong);
}
.z-btn--primary:hover, .z-btn--pill:hover { transform: translateY(-1px); box-shadow: 0 10px 34px -8px var(--glow-brand), inset 0 1px 0 var(--color-line-strong); }
.z-btn--pill { border-radius: var(--radius-pill); text-transform: none; letter-spacing: 0; font-size: 13px; }
.z-btn--secondary { background: var(--color-brand-secondary); color: var(--color-text-default); box-shadow: inset 0 1px 0 var(--color-line-strong); }
.z-btn--secondary:hover { transform: translateY(-1px); background: color-mix(in srgb, var(--color-brand-secondary) 85%, var(--color-brand-secondary-300)); box-shadow: 0 10px 30px -10px color-mix(in srgb, var(--color-brand-secondary) 70%, transparent), inset 0 1px 0 var(--color-line-strong); }
.z-btn--ghost { background: var(--color-bg-surface); border-color: var(--color-line-strong); color: var(--color-text-default); }
.z-btn--ghost:hover { background: var(--color-bg-surface-2); transform: translateY(-1px); }
.z-btn--light { background: var(--color-text-default); color: var(--ink); }
.z-btn--light:hover { transform: translateY(-1px); box-shadow: 0 10px 30px -12px var(--color-text-muted); }
</style>
