<script setup>
import ZIconTile from '../ui/ZIconTile.vue';
import ZTag from '../ui/ZTag.vue';
import AppVideo from '../visuals/AppVideo.vue';

// Section Mobile Money : schéma animé « liquidité profonde » (une vidéo par langue,
// rechargée au changement de langue grâce à la clé) et trois avantages.
defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});
</script>

<template>
  <section :id="data.id" class="section section--center mm">
    <div class="container">
      <ZTag v-if="data.tag" v-reveal>{{ data.tag }}</ZTag>
      <h2 v-split class="title mm__title" v-html="data.title" />
      <p v-reveal class="lede mm__text">{{ data.text }}</p>

      <div v-reveal class="mm__stage">
        <AppVideo :key="data.video.webm" :video="data.video" toggle="corner" />
      </div>

      <ul class="mm__perks">
        <li v-for="perk in data.perks" :key="perk.title" v-reveal>
          <ZIconTile :icon="perk.icon" />
          <div>
            <h3>{{ perk.title }}</h3>
            <p>{{ perk.text }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.mm__title { max-width: 16em; margin-inline: auto; }
.mm__title:not(:first-child) { margin-top: 26px; }
.mm__text { margin-top: 22px; }
/* La vidéo a une marge transparente intégrée : on la laisse déborder un peu pour garder le schéma lisible. */
.mm__stage { width: min(1100px, 100%); margin: 24px auto 64px; }
.mm__perks { display: grid; grid-template-columns: repeat(3, minmax(0, 260px)); justify-content: center; gap: 28px 40px; text-align: left; }
.mm__perks li { display: flex; gap: 14px; }
.mm__perks h3 { font-size: 13.5px; font-weight: var(--font-weight-semibold); }
.mm__perks p { font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 2px; }
@media (max-width: 900px) {
  .mm__perks { grid-template-columns: minmax(0, 320px); }
  .mm__stage { width: calc(100% + 2 * var(--space-gutter-mobile)); margin-inline: calc(-1 * var(--space-gutter-mobile)); margin-bottom: 72px; }
  .mm__stage :deep(.av__toggle) { right: var(--space-gutter-mobile); bottom: -52px; }
}
</style>
