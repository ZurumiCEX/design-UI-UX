import { onBeforeUnmount, onMounted } from 'vue';
import { coins } from '../content/data.js';
import { createDemoFeed } from '../market/demoFeed.js';

// Un seul flux de cours pour toute la page, démarré tant qu'un composant l'utilise,
// en pause quand l'onglet est masqué.
let feed;
let users = 0;

function onVisibility() {
  if (document.hidden) feed.stop();
  else if (users) feed.start();
}

export function useMarketFeed() {
  feed ??= createDemoFeed(coins);
  onMounted(() => {
    if (users++ === 0) {
      feed.start();
      document.addEventListener('visibilitychange', onVisibility);
    }
  });
  onBeforeUnmount(() => {
    if (--users === 0) {
      feed.stop();
      document.removeEventListener('visibilitychange', onVisibility);
    }
  });
  return feed.state;
}

/** Cours d'un actif dans le flux (sans démarrer le flux). */
export function coinById(id) {
  feed ??= createDemoFeed(coins);
  return feed.state.coins.find((c) => c.id === id);
}
