import { seededRandom } from './random.js';

// DÉMO — historique du portefeuille et transactions générés de façon déterministe.
// À remplacer par l'API : gardez la forme des objets.
const DAY = 86400e3;

/** Valeur totale (XOF) jour par jour sur `days` jours, se terminant sur `end`. */
export function portfolioHistory(end, days = 90, seed = 31) {
  const rand = seededRandom(seed);
  const raw = [1];
  for (let i = 1; i < days; i++) raw.push(raw[i - 1] * (1 + (rand() - 0.47) * 0.045));
  const k = end / raw[raw.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return raw.map((v, i) => ({ t: today.getTime() - (days - 1 - i) * DAY, v: v * k }));
}

/** P&L quotidien : variation de valeur d'un jour à l'autre. */
export function dailyPnl(history) {
  return history.slice(1).map((d, i) => ({ t: d.t, v: d.v - history[i].v, pct: (d.v / history[i].v - 1) * 100 }));
}

const TYPES = ['deposit', 'buy', 'receive', 'convert', 'send', 'p2p', 'withdraw', 'sell'];
const COINS = ['usdt', 'usdt', 'usdt', 'btc', 'eth', 'sol', 'trx', 'usdc'];
const STATUSES = ['success', 'success', 'success', 'success', 'success', 'success', 'pending', 'cancelled', 'failed'];
const METHODS = ['wave', 'orange', 'mixx'];
const NETWORKS = { usdt: 'TRC20', usdc: 'Polygon', btc: 'Bitcoin', eth: 'ERC20', sol: 'Solana', trx: 'TRC20' };

/** Transactions fictives des 60 derniers jours, de la plus récente à la plus ancienne. */
export function demoTransactions(coins, count = 34, seed = 77) {
  const rand = seededRandom(seed);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const now = Date.now();
  const out = [];
  let t = now - 40 * 60e3;
  for (let i = 0; i < count; i++) {
    const type = pick(TYPES);
    const coinId = type === 'p2p' ? pick(['usdt', 'usdc']) : pick(COINS);
    const coin = coins.find((c) => c.id === coinId);
    const xof = Math.round((5000 + rand() ** 2 * 400000) / 100) * 100;
    const amount = xof / coin.price;
    const status = i === 0 ? 'pending' : pick(STATUSES);
    const outgoing = ['send', 'withdraw', 'sell', 'p2p'].includes(type);
    out.push({
      id: `TX${(9837261 - i * 4137).toString(36).toUpperCase()}${Math.floor(rand() * 1e4)}`,
      type,
      status,
      coin: coinId,
      amount,
      xof,
      direction: type === 'convert' ? 0 : outgoing ? -1 : 1,
      to: type === 'convert' ? pick(['usdt', 'btc', 'eth'].filter((c) => c !== coinId)) : null,
      fee: ['send', 'withdraw'].includes(type) ? amount * 0.004 : ['buy', 'sell', 'convert'].includes(type) ? amount * 0.001 : 0,
      method: ['buy', 'sell', 'p2p', 'withdraw'].includes(type) ? pick(METHODS) : null,
      network: ['deposit', 'receive', 'send'].includes(type) ? NETWORKS[coinId] : null,
      at: t,
    });
    t -= (2 + rand() * 40) * 3600e3;
  }
  return out;
}
