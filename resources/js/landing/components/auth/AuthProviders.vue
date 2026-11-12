<script setup>
import ZIcon from '../ui/ZIcon.vue';

// « Ou continuez avec » + fournisseurs d'identité (routes à brancher).
defineProps({
  data: { type: Object, required: true }, // auth
  href: { type: String, default: '#' },
});
</script>

<template>
  <div class="prov">
    <p class="prov__or"><span>{{ data.or }}</span></p>
    <div class="prov__list">
      <a v-for="p in data.providers" :key="p.id" class="prov__btn" :href="href">
        <ZIcon :name="p.id" :size="18" /> {{ p.label }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.prov { margin-top: 28px; }
.prov__or { display: flex; align-items: center; gap: 14px; font-size: var(--font-size-small); color: var(--color-text-dim); }
.prov__or::before, .prov__or::after { content: ''; flex: 1; height: 1px; background: var(--color-line-default); }
.prov__list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
.prov__btn {
  display: flex; align-items: center; justify-content: center; gap: 10px; height: 46px; border-radius: var(--radius-md);
  background: var(--color-bg-surface-2); border: 1px solid var(--color-line-default); font-size: 14px; font-weight: var(--font-weight-medium);
  transition: border-color var(--motion-duration-hover), transform var(--motion-duration-hover) var(--motion-ease-out);
}
.prov__btn:hover { border-color: var(--color-line-strong); transform: translateY(-1px); }
</style>
