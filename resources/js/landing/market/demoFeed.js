import { reactive } from 'vue';
import { seededRandom } from './random.js';

// DÉMO — flux de cours simulé dans le navigateur.
// Pour brancher une API ou un WebSocket : gardez la forme de `state.coins`
// (price, change['1h'|'4h'|'24h'], cap, volume, spark, dir, seq) et remplacez `step()` par vos mises à jour.
const SPARK_POINTS = 24;

function makeSpark(rand, coin) {
  const end = coin.price;
  const start = end / (1 + coin.change['24h'] / 100);
  const noise = coin.category === 'stable' ? 0.0006 : 0.012;
  return Array.from({ length: SPARK_POINTS }, (_, i) => {
    const t = i / (SPARK_POINTS - 1);
    const jitter = i === 0 || i === SPARK_POINTS - 1 ? 0 : (rand() - 0.5) * 2 * noise;
    return (start + (end - start) * t) * (1 + jitter);
  });
}

export function createDemoFeed(coins, { interval = 2600, seed = 7 } = {}) {
  const rand = seededRandom(seed);
  const state = reactive({
    coins: coins.map((c) => ({
      ...c,
      change: { ...c.change },
      open24: c.price / (1 + c.change['24h'] / 100),
      spark: makeSpark(rand, c),
      dir: 0, // +1 hausse, −1 baisse au dernier tick
      seq: 0, // incrémenté à chaque mise à jour (sert à rejouer l'éclair)
    })),
  });

  function step() {
    for (const c of state.coins) {
      if (rand() < 0.5) continue; // tous les cours ne bougent pas à chaque tick
      const vol = c.category === 'stable' ? 0.00015 : 0.0022;
      const d = (rand() - 0.5) * 2 * vol;
      c.price *= 1 + d;
      c.change['24h'] = (c.price / c.open24 - 1) * 100;
      c.change['4h'] += d * 100;
      c.change['1h'] += d * 100;
      c.cap *= 1 + d;
      c.volume *= 1 + Math.abs(d) * 0.4;
      c.spark[c.spark.length - 1] = c.price;
      c.dir = d >= 0 ? 1 : -1;
      c.seq++;
    }
  }

  let timer = 0;
  const start = () => (timer ||= setInterval(step, interval));
  const stop = () => {
    clearInterval(timer);
    timer = 0;
  };
  return { state, start, stop, step };
}
