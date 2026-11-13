<script setup>
import ZIcon from '../ui/ZIcon.vue';

// Petit tutoriel affiché à côté d'un widget. L'étape en cours suit la saisie (prop `active`).
defineProps({
  data: { type: Object, required: true }, // { title, steps: [{ title, text }], tipsTitle, tips: [], link?: { text, label, href } }
  active: { type: Number, default: 0 },
});
</script>

<template>
  <aside class="tuto z-panel" :aria-labelledby="`tuto-${data.title.length}`">
    <h2 :id="`tuto-${data.title.length}`" class="tuto__title">{{ data.title }}</h2>
    <ol class="tuto__steps">
      <li
        v-for="(s, i) in data.steps"
        :key="s.title"
        :class="{ 'is-done': i < active, 'is-active': i === active }"
        :aria-current="i === active ? 'step' : undefined"
      >
        <span class="tuto__num num" aria-hidden="true">
          <ZIcon v-if="i < active" name="check" :size="12" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </div>
      </li>
    </ol>

    <div v-if="data.tips?.length" class="tuto__tips">
      <h3><ZIcon name="info" :size="15" /> {{ data.tipsTitle }}</h3>
      <ul>
        <li v-for="tip in data.tips" :key="tip">{{ tip }}</li>
      </ul>
    </div>

    <p v-if="data.link" class="tuto__link">
      {{ data.link.text }}
      <a :href="data.link.href">{{ data.link.label }} <ZIcon name="arrow-right" :size="13" /></a>
    </p>
  </aside>
</template>

<style scoped>
.tuto { padding: 26px; }
.tuto__title { font-size: 17px; font-weight: var(--font-weight-semibold); letter-spacing: -0.01em; }
.tuto__steps { position: relative; display: grid; gap: 4px; margin-top: 20px; }
.tuto__steps li { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 14px; padding: 10px 0; }
.tuto__steps li:not(:last-child)::after { content: ''; position: absolute; left: 13.5px; top: 40px; bottom: -6px; width: 1px; background: var(--color-line-default); }
.tuto__steps li.is-done::after { background: var(--color-brand-primary-300); }
.tuto__num {
  position: relative; isolation: isolate; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%;
  font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-text-muted); border: 1px solid var(--color-line-strong);
  transition: color var(--motion-duration-hover), border-color var(--motion-duration-hover);
}
.tuto__num::before { content: ''; position: absolute; inset: -1px; z-index: -1; border-radius: inherit; background: var(--gradient-brand); opacity: 0; transition: opacity var(--duration-rule) var(--motion-ease-out); }
.is-active .tuto__num, .is-done .tuto__num { color: var(--color-text-default); border-color: transparent; }
.is-active .tuto__num::before, .is-done .tuto__num::before { opacity: 1; }
.is-active .tuto__num { box-shadow: 0 0 24px -4px var(--glow-brand); }
.tuto__steps h3 { font-size: 14px; font-weight: var(--font-weight-semibold); padding-top: 4px; color: var(--color-text-muted); transition: color var(--motion-duration-hover); }
.is-active h3, .is-done h3 { color: var(--color-text-default); }
.tuto__steps p { margin-top: 3px; font-size: 13px; color: var(--color-text-dim); transition: color var(--motion-duration-hover); }
.is-active p { color: var(--color-text-muted); }
.tuto__tips { margin-top: 18px; padding: 16px; border-radius: var(--radius-md); background: var(--color-bg-surface-2); }
.tuto__tips h3 { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: var(--font-weight-semibold); color: var(--color-brand-primary-300); }
.tuto__tips ul { display: grid; gap: 8px; margin-top: 10px; padding-left: 18px; list-style: disc; font-size: 12.5px; color: var(--color-text-muted); }
.tuto__tips li::marker { color: var(--color-text-dim); }
.tuto__link { margin-top: 18px; font-size: 13px; color: var(--color-text-muted); }
.tuto__link a { display: inline-flex; align-items: center; gap: 4px; color: var(--color-brand-primary-300); font-weight: var(--font-weight-medium); }
.tuto__link a:hover { color: var(--color-text-default); }
</style>
