import { pairs } from '../content/data.js';

// Liens contextuels vers l'achat rapide et le trade. Un lien « # » (route à brancher) reste « # ».
const withQuery = (href, params) => (href === '#' ? '#' : `${href}?${new URLSearchParams(params)}`);

export function pairForCoin(coin) {
  return pairs.find((p) => p.base === coin.ticker && p.quote === 'USDT') ?? pairs.find((p) => p.base === coin.ticker);
}

export function tradeHref(links, coin) {
  const pair = pairForCoin(coin);
  return pair ? withQuery(links.trade, { pair: pair.id }) : null;
}

export function buyHref(links, coin, mode) {
  return withQuery(links.quickBuy, mode ? { crypto: coin.id, mode } : { crypto: coin.id });
}

export function pairHref(links, pairId) {
  return withQuery(links.trade, { pair: pairId });
}
