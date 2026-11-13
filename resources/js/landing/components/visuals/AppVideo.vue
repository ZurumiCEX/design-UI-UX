<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '../../composables/useReducedMotion.js';
import ZIcon from '../ui/ZIcon.vue';

// Vidéo du parcours d'achat (fond transparent). Chargée à l'approche du viewport,
// lue seulement quand elle est visible, jamais en lecture automatique si l'utilisateur
// préfère réduire les animations. Un bouton permet toujours de la mettre en pause.
const props = defineProps({
  video: { type: Object, required: true }, // { webm, mp4, poster, label, play, pause }
});

const el = ref(null);
const box = ref(null);
const loaded = ref(false);
const playing = ref(false);
let wanted = !prefersReducedMotion(); // l'utilisateur a-t-il demandé la lecture ?
let visible = false;
let io;

// Safari (et tous les navigateurs iOS, qui utilisent WebKit) lit le WebM sans sa transparence :
// on lui sert le MP4 rendu sur le fond de page.
const webkitOnly = typeof navigator !== 'undefined' && /^((?!chrome|chromium|android|edg).)*safari/i.test(navigator.userAgent);

function sync() {
  const v = el.value;
  if (!v || !loaded.value) return;
  if (wanted && visible) v.play().catch(() => {});
  else v.pause();
}
function toggle() {
  wanted = !wanted;
  sync();
}
onMounted(() => {
  io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !loaded.value) loaded.value = true;
      visible = entry.intersectionRatio > 0.15;
      requestAnimationFrame(sync);
    },
    { rootMargin: '300px 0px', threshold: [0, 0.15] },
  );
  io.observe(box.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <figure ref="box" class="av">
    <video
      ref="el"
      class="av__video"
      :poster="video.poster"
      :aria-label="video.label"
      muted
      loop
      playsinline
      disablepictureinpicture
      preload="none"
      width="1080"
      height="1920"
      @canplay="sync"
      @play="playing = true"
      @pause="playing = false"
    >
      <template v-if="loaded">
        <source v-if="!webkitOnly" :src="video.webm" type='video/webm; codecs="vp9"' />
        <source :src="video.mp4" type="video/mp4" />
      </template>
    </video>
    <button type="button" class="av__toggle" :aria-label="playing ? video.pause : video.play" :title="playing ? video.pause : video.play" @click="toggle">
      <ZIcon v-if="playing" name="pause" :size="14" />
      <ZIcon v-else name="play" :size="14" />
    </button>
  </figure>
</template>

<style scoped>
.av { position: relative; margin: 0; width: 100%; aspect-ratio: 1080 / 1920; }
.av__video { display: block; width: 100%; height: 100%; object-fit: contain; }
/* Le bouton se place dans la marge transparente, à droite du téléphone : il ne masque pas l’écran. */
.av__toggle {
  position: absolute; right: 0; bottom: 6%; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%;
  color: var(--color-text-default); background: color-mix(in srgb, var(--color-bg-surface) 80%, transparent); border: 1px solid var(--color-line-strong);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); opacity: 0.75; transition: opacity var(--motion-duration-hover), transform var(--motion-duration-hover);
}
.av__toggle:hover, .av__toggle:focus-visible { opacity: 1; transform: scale(1.06); }
</style>
