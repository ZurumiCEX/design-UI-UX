<script setup>
import ZIconTile from '../ui/ZIconTile.vue';
import ZStoreButton from '../ui/ZStoreButton.vue';
import ZTag from '../ui/ZTag.vue';
import DashboardMock from '../visuals/DashboardMock.vue';

// Section « portefeuille partout » : le globe est passé dans le hero,
// l'aperçu du tableau de bord prend sa place.
defineProps({
  data: { type: Object, required: true },
  common: { type: Object, required: true },
});
</script>

<template>
  <section :id="data.id" class="section globe">
    <div class="container globe__layout">
      <div class="globe__copy">
        <ZTag v-reveal>{{ data.tag }}</ZTag>
        <h2 v-split class="title globe__title" v-html="data.title" />
        <p v-reveal class="lede globe__text">{{ data.text }}</p>
        <ul class="globe__features">
          <li v-for="f in data.features" :key="f.label" v-reveal>
            <ZIconTile :icon="f.icon" :size="26" /> {{ f.label }}
          </li>
        </ul>
        <div v-reveal class="globe__stores">
          <ZStoreButton v-for="store in common.stores" :key="store.id" :store="store" variant="light" />
        </div>
      </div>
    </div>

    <div v-reveal class="globe__mock">
      <div class="globe__mock-in">
        <DashboardMock :data="data.dashboard" :coins="common.coins" :brand="common.brand" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.globe { position: relative; overflow: hidden; padding-bottom: calc(var(--space-section-y) * 1.1); }
.globe__layout { position: relative; z-index: 1; }
.globe__copy { max-width: 560px; }
.globe__title { margin-top: 30px; font-size: clamp(38px, 5.8vw, 80px); }
.globe__text { margin-top: 26px; }
.globe__features { display: grid; gap: 16px; margin: 44px 0 40px; font-size: 14px; }
.globe__features li { display: flex; align-items: center; gap: 14px; }
.globe__stores { display: flex; flex-wrap: wrap; gap: 8px; }
.globe__mock { position: absolute; left: 52%; top: 50%; margin-top: -244px; perspective: 1600px; pointer-events: none; }
.globe__mock-in { transform-origin: 0 50%; transform: rotateY(-8deg) rotateX(2deg); }
@media (max-width: 1100px) {
  .globe__mock { position: relative; left: auto; top: auto; margin: 48px 0 0 var(--space-gutter-mobile); height: 340px; }
  .globe__mock-in { transform: scale(0.66); transform-origin: 0 0; }
}
@media (max-width: 520px) {
  .globe__mock { height: 250px; }
  .globe__mock-in { transform: scale(0.48); }
}
</style>
