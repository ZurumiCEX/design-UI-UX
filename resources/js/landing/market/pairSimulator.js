import { markRaw, reactive } from 'vue';
import { seededRandom, seedFrom } from './random.js';

// DÉMO — simulateur d'une paire : chandeliers, carnet d'ordres et transactions.
// Pour brancher une API / un WebSocket : gardez la forme de `state` et remplacez `step()`,
// `buildBook()` et `seriesFor()` par vos données.
export const TIMEFRAMES = { '15m': 15 * 60e3, '1h': 3600e3, '4h': 4 * 3600e3, '1d': 86400e3, '1w': 7 * 86400e3 };
const CANDLES = 180;
const LEVELS = 16;
const MAX_TRADES = 40;

/** Pas de cotation : 6 chiffres significatifs environ (BTC ≈ 96 000 → 0,1). */
export function tickSize(price) {
  return 10 ** (Math.floor(Math.log10(price)) - 5);
}
export const decimalsOf = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
/** Décimales d'une quantité selon le prix (BTC : 6, TRX : 2). */
export const amountDecimals = (price) => Math.min(8, Math.max(2, Math.ceil(Math.log10(price)) + 1));

function genCandles(rand, end, interval, vol, now) {
  const out = [];
  let p = 1;
  const t0 = Math.floor(now / interval) * interval - (CANDLES - 1) * interval;
  for (let i = 0; i < CANDLES; i++) {
    const o = p;
    const c = o * (1 + (rand() - 0.5) * 2 * vol + Math.sin(i / 23) * vol * 0.35);
    const h = Math.max(o, c) * (1 + rand() * vol * 0.7);
    const l = Math.min(o, c) * (1 - rand() * vol * 0.7);
    out.push({ t: t0 + i * interval, o, h, l, c, v: 0.25 + rand() ** 2 * 1.8 });
    p = c;
  }
  const k = end / p; // la dernière clôture tombe sur le cours actuel
  for (const d of out) {
    d.o *= k;
    d.h *= k;
    d.l *= k;
    d.c *= k;
  }
  return out;
}

export function createPairSim({ pair, price, change24h = 0, volumeQuote = 1e6, stable = false }) {
  const rand = seededRandom(seedFrom(pair.id));
  const tick = tickSize(price);
  const vol = stable ? 0.0005 : 0.0045; // volatilité par bougie de 15 min
  const series = {};
  let tradeId = 0;
  let timer = 0;

  const state = reactive({
    pair,
    tick,
    decimals: decimalsOf(tick),
    amountDecimals: amountDecimals(price),
    last: price,
    prev: price,
    open24: price / (1 + change24h / 100),
    high24: 0,
    low24: 0,
    volQuote: volumeQuote,
    volBase: volumeQuote / price,
    timeframe: '15m',
    candles: markRaw([]),
    group: tick, // regroupement du carnet
    book: markRaw({ asks: [], bids: [], max: 1, ratio: 0.5 }),
    trades: [],
    seq: 0,
  });
  const unit = state.volBase / 4e5; // ordre de grandeur des quantités du carnet

  function seriesFor(tf) {
    const iv = TIMEFRAMES[tf];
    if (!series[tf]) series[tf] = genCandles(rand, state.last, iv, vol * Math.sqrt(iv / TIMEFRAMES['15m']) * 0.55, Date.now());
    const s = series[tf];
    const k = state.last / s[s.length - 1].c; // recale la série sur le cours actuel
    if (Math.abs(k - 1) > 1e-12) for (const d of s) { d.o *= k; d.h *= k; d.l *= k; d.c *= k; }
    return s;
  }

  function buildBook() {
    const g = state.group;
    const asks = [];
    const bids = [];
    let p = Math.floor(state.last / g) * g + g;
    let total = 0;
    for (let i = 0; i < LEVELS; i++) {
      const amount = unit * (0.05 + rand() ** 2 * 4) * (1 + i * 0.08);
      total += amount;
      asks.push({ price: p, amount, total });
      p += g * (1 + (rand() < 0.25 ? 1 : 0));
    }
    p = Math.floor(state.last / g) * g;
    if (p >= asks[0].price) p -= g;
    total = 0;
    for (let i = 0; i < LEVELS; i++) {
      const amount = unit * (0.05 + rand() ** 2 * 4) * (1 + i * 0.08);
      total += amount;
      bids.push({ price: p, amount, total });
      p -= g * (1 + (rand() < 0.25 ? 1 : 0));
    }
    const bidSum = bids[bids.length - 1].total;
    const askSum = asks[asks.length - 1].total;
    state.book = markRaw({ asks, bids, max: Math.max(bidSum, askSum), ratio: bidSum / (bidSum + askSum) });
  }

  function setTimeframe(tf) {
    state.timeframe = tf;
    state.candles = markRaw(seriesFor(tf));
    state.seq++;
  }
  function setGroup(g) {
    state.group = g;
    buildBook();
    state.seq++;
  }

  function step() {
    const d = (rand() - 0.5) * 2 * vol * 0.3;
    state.prev = state.last;
    state.last = Math.max(tick, Math.round((state.last * (1 + d)) / tick) * tick);
    state.high24 = Math.max(state.high24, state.last);
    state.low24 = Math.min(state.low24, state.last);

    const cs = series[state.timeframe];
    const lastCandle = cs[cs.length - 1];
    const iv = TIMEFRAMES[state.timeframe];
    if (Date.now() >= lastCandle.t + iv) {
      cs.push({ t: lastCandle.t + iv, o: lastCandle.c, h: Math.max(lastCandle.c, state.last), l: Math.min(lastCandle.c, state.last), c: state.last, v: 0.05 });
      cs.shift();
    } else {
      lastCandle.c = state.last;
      lastCandle.h = Math.max(lastCandle.h, state.last);
      lastCandle.l = Math.min(lastCandle.l, state.last);
      lastCandle.v += rand() * 0.04;
    }

    const n = 1 + Math.floor(rand() * 3);
    const now = Date.now();
    for (let i = 0; i < n; i++) {
      const side = rand() < 0.5 ? 'buy' : 'sell';
      const amount = unit * (0.02 + rand() ** 3 * 2);
      state.trades.unshift({ id: ++tradeId, side, price: state.last + (side === 'buy' ? 0 : -tick) * Math.floor(rand() * 2), amount, t: now - i * 120 });
      state.volBase += amount;
      state.volQuote += amount * state.last;
    }
    if (state.trades.length > MAX_TRADES) state.trades.splice(MAX_TRADES);

    buildBook();
    state.seq++;
  }

  // Initialisation : séries, statistiques 24 h, carnet et premières transactions.
  const hours = seriesFor('1h').slice(-24);
  state.high24 = Math.max(...hours.map((c) => c.h), state.last);
  state.low24 = Math.min(...hours.map((c) => c.l), state.last);
  setTimeframe('15m');
  buildBook();
  for (let i = 0; i < 18; i++) step();

  return {
    state,
    setTimeframe,
    setGroup,
    start: () => (timer ||= setInterval(step, 1000)),
    stop: () => {
      clearInterval(timer);
      timer = 0;
    },
  };
}
