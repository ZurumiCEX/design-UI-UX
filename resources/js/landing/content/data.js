// Données indépendantes de la langue : liens, actifs, paires, moyens de paiement, pays.
// Les textes traduisibles vivent dans fr.js / en.js.

// Liens par défaut du squelette. Dans Laravel, remplacez-les via window.__LANDING__.links (routes nommées).
// '#' = route à brancher : n'inventez pas d'URL.
export const defaultLinks = {
  home: '/',
  quickBuy: '/achat-rapide/',
  markets: '/marches/',
  trade: '/trade/',
  login: '/connexion/',
  signup: '/inscription/',
  send: '#',
  receive: '#',
  swap: '#',
  withdraw: '#',
  wallet: '#',
  deposit: '#',
  search: '#',
  forgotPassword: '#',
  terms: '#',
  privacy: '#',
  appStore: '#',
  googlePlay: '#',
  // À REMPLACER — lien de téléchargement réel, encodé dans le QR code.
  download: 'https://example.com/zurumi-app',
  // Actions de formulaires côté serveur. '#' = non branché : le formulaire affiche un message de démo.
  loginAction: '#',
  signupAction: '#',
  buyAction: '#',
};

// Taux de référence USDT → XOF. DÉMO — à remplacer par le taux de l'API.
export const USDT_XOF = 607;

// DÉMO — à remplacer : cours (XOF), variations (%), capitalisations et volumes (XOF) fictifs.
// Prévu pour venir d'une API : gardez cette forme et remplacez la source dans market/demoFeed.js.
// `tone` est une donnée de présentation (couleur de pastille propre à chaque actif).
export const coins = [
  { id: 'btc', ticker: 'BTC', name: 'Bitcoin', glyph: '₿', tone: '#F7931A', category: 'layer1', price: 58412300, change: { '1h': 0.21, '4h': 0.64, '24h': 1.84 }, cap: 1.16e15, volume: 2.1e13 },
  { id: 'eth', ticker: 'ETH', name: 'Ethereum', glyph: 'Ξ', tone: '#596FB7', category: 'layer1', price: 1472800, change: { '1h': -0.12, '4h': 0.4, '24h': 0.92 }, cap: 1.77e14, volume: 9.8e12 },
  { id: 'usdt', ticker: 'USDT', name: 'Tether', glyph: '₮', tone: '#26A17B', category: 'stable', price: 607, change: { '1h': 0, '4h': 0.01, '24h': 0.02 }, cap: 8.7e13, volume: 3.4e13 },
  { id: 'sol', ticker: 'SOL', name: 'Solana', glyph: 'S', tone: '#5D3587', category: 'layer1', price: 98450, change: { '1h': -0.3, '4h': -0.9, '24h': -1.61 }, cap: 4.7e13, volume: 2.3e12 },
  { id: 'bnb', ticker: 'BNB', name: 'BNB', glyph: 'B', tone: '#F3BA2F', category: 'layer1', price: 371200, change: { '1h': 0.1, '4h': -0.2, '24h': -0.47 }, cap: 5.4e13, volume: 9.1e11 },
  { id: 'usdc', ticker: 'USDC', name: 'USD Coin', glyph: '$', tone: '#2775CA', category: 'stable', price: 606, change: { '1h': 0, '4h': 0, '24h': 0.01 }, cap: 3.6e13, volume: 4.2e12 },
  { id: 'xrp', ticker: 'XRP', name: 'XRP', glyph: 'X', tone: '#3A4150', category: 'layer1', price: 1395, change: { '1h': -0.4, '4h': -0.9, '24h': -1.72 }, cap: 8.0e13, volume: 1.9e12 },
  { id: 'trx', ticker: 'TRX', name: 'Tron', glyph: 'T', tone: '#EB0029', category: 'layer1', price: 172, change: { '1h': 0.3, '4h': 1.1, '24h': 2.1 }, cap: 1.5e13, volume: 3.9e11 },
  { id: 'doge', ticker: 'DOGE', name: 'Dogecoin', glyph: 'Ð', tone: '#C2A633', category: 'meme', price: 98, change: { '1h': 0.8, '4h': 1.9, '24h': 3.42 }, cap: 1.4e13, volume: 8.2e11 },
  { id: 'ton', ticker: 'TON', name: 'Toncoin', glyph: '◇', tone: '#0098EA', category: 'layer1', price: 1830, change: { '1h': 1.2, '4h': 2.6, '24h': 5.12 }, cap: 4.6e12, volume: 2.2e11, isNew: true },
  { id: 'ada', ticker: 'ADA', name: 'Cardano', glyph: 'A', tone: '#0033AD', category: 'layer1', price: 410, change: { '1h': -0.1, '4h': -0.3, '24h': -0.66 }, cap: 1.5e13, volume: 3.1e11 },
  { id: 'avax', ticker: 'AVAX', name: 'Avalanche', glyph: 'Λ', tone: '#E84142', category: 'layer1', price: 14200, change: { '1h': 0.4, '4h': 0.7, '24h': 1.27 }, cap: 5.8e12, volume: 2.7e11 },
  { id: 'link', ticker: 'LINK', name: 'Chainlink', glyph: 'L', tone: '#2A5ADA', category: 'defi', price: 8650, change: { '1h': 0.6, '4h': 1.4, '24h': 2.85 }, cap: 5.4e12, volume: 2.9e11, isNew: true },
  { id: 'pol', ticker: 'POL', name: 'Polygon', glyph: 'P', tone: '#8247E5', category: 'layer2', price: 264, change: { '1h': 0.05, '4h': -0.4, '24h': -0.88 }, cap: 2.6e12, volume: 1.1e11, isNew: true },
  { id: 'dai', ticker: 'DAI', name: 'Dai', glyph: '◈', tone: '#F5AC37', category: 'stable', price: 607, change: { '1h': 0, '4h': -0.01, '24h': 0.01 }, cap: 3.3e12, volume: 1.6e11 },
];

export const categories = ['layer1', 'layer2', 'stable', 'meme', 'defi'];

// Paires de trading : chaque crypto non stable contre USDT, plus USDT/XOF.
export const pairs = [
  ...coins.filter((c) => c.category !== 'stable').map((c) => ({ id: `${c.ticker}-USDT`, base: c.ticker, quote: 'USDT', coin: c.id })),
  { id: 'USDT-XOF', base: 'USDT', quote: 'XOF', coin: 'usdt' },
];

// Moyens de paiement cités par Zurumi. Ne pas en ajouter sans validation.
export const paymentMethods = [
  { id: 'wave', name: 'Wave', tone: '#1DC8FF', glyph: 'W' },
  { id: 'orange', name: 'Orange Money', tone: '#FF7900', glyph: 'O' },
  { id: 'mixx', name: 'Mixx by Yas', tone: '#FFD200', glyph: 'M' },
];

// Pays de la zone UEMOA (XOF) et indicatifs. Les noms sont traduits dans fr.js / en.js.
export const countries = [
  { id: 'BJ', dial: '+229' },
  { id: 'BF', dial: '+226' },
  { id: 'CI', dial: '+225' },
  { id: 'GW', dial: '+245' },
  { id: 'ML', dial: '+223' },
  { id: 'NE', dial: '+227' },
  { id: 'SN', dial: '+221' },
  { id: 'TG', dial: '+228' },
];
export const defaultCountry = 'SN';

// DÉMO — à remplacer : limites de l'achat rapide, en XOF.
export const buyLimits = { min: 1000, max: 2000000 };

// Langues proposées dans le sélecteur.
export const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];
