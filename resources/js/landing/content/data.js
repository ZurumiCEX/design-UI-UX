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
  send: '/envoyer/',
  receive: '/recevoir/',
  swap: '/convertir/',
  withdraw: '/p2p/',
  verify: '/verify/',
  report: '/signaler-une-arnaque/',
  terms: '/legal/conditions/',
  privacy: '/legal/confidentialite/',
  cookies: '/legal/cookies/',
  whistleblowing: '/legal/denonciation/',
  faq: '/legal/faq/',
  wallet: '/portefeuille/',
  deposit: '#',
  search: '#',
  forgotPassword: '/mot-de-passe-oublie/',
  security: '#',
  account: '/compte/',
  profile: '/compte/profil/',
  accountSecurity: '/compte/securite/',
  kyc: '/compte/verification/',
  status: '/etat-des-services/',
  help: '/aide/',
  about: '/a-propos/',
  careers: '/carrieres/',
  press: '/presse/',
  contact: '/contact/',
  // Réseaux sociaux officiels — à remplacer par les vraies URL.
  facebook: '#',
  x: '#',
  instagram: '#',
  linkedin: '#',
  telegram: '#',
  tiktok: '#',
  youtube: '#',
  logout: '#',
  support: '#', // À DÉFINIR : lien du support (chat, formulaire…)
  whatsapp: '#', // À DÉFINIR : lien WhatsApp du support (https://wa.me/…)
  appStore: '#',
  googlePlay: '#',
  // À REMPLACER — lien de téléchargement réel, encodé dans le QR code.
  download: 'https://example.com/zurumi-app',
  // Actions de formulaires côté serveur. '#' = non branché : le formulaire affiche un message de démo.
  loginAction: '#',
  signupAction: '#',
  buyAction: '#',
  convertAction: '#',
  sendAction: '#',
  p2pAction: '#',
  // Signalement : point d'entrée POST multipart (voir integration/signalement/). '#' = démo.
  reportAction: '#',
  contactAction: '#',
  careersAction: '#',
  profileAction: '#',
  kycAction: '#',
  forgotAction: '#',
  statusSubscribeAction: '#',
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
  { id: 'wave', name: 'Wave', tone: '#1DC8FF', glyph: 'W', logos: ['/images/payments/wave.webp'] },
  { id: 'orange', name: 'Orange Money', tone: '#FF7900', glyph: 'O', logos: ['/images/payments/orange-money.webp'] },
  { id: 'mixx', name: 'Mixx by Yas', tone: '#FFD200', glyph: 'M', logos: ['/images/payments/mixx.webp'] },
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
// Achat rapide : devises de paiement (limites dans la devise), moyens de paiement (logos dans
// public/images/payments/, frais de traitement), frais réseau et taux USD → XOF. DÉMO, à brancher.
export const buy = {
  usdXof: 607, // = USD_XOF
  networkFeeUsd: 0.99,
  currencies: [
    { id: 'XOF', glyph: 'F', tone: '#0A8F5B', min: 5000, max: 3000000, decimals: 0 },
    { id: 'USD', glyph: '$', tone: '#F0B90B', min: 10, max: 5000, decimals: 2 },
  ],
  methods: [
    { id: 'card', logos: ['/images/payments/visa.webp', '/images/payments/mastercard.webp'], fee: 0.015 },
    { id: 'wave', name: 'Wave', logos: ['/images/payments/wave.webp'], fee: 0.01 },
    { id: 'orange', name: 'Orange Money', logos: ['/images/payments/orange-money.webp'], fee: 0.01 },
    { id: 'mixx', name: 'Mixx by Yas', logos: ['/images/payments/mixx.webp'], fee: 0.01 },
    { id: 'mtn', name: 'MTN Mobile Money', logos: ['/images/payments/mtn.webp'], fee: 0.01 },
    { id: 'moov', name: 'Moov Money', logos: ['/images/payments/moov.webp'], fee: 0.01 },
    { id: 'wizall', name: 'Wizall Money', logos: ['/images/payments/wizall.webp'], fee: 0.01 },
    { id: 'emoney', name: 'E-Money', logos: ['/images/payments/e-money.webp'], fee: 0.01 },
  ],
};

// Langues proposées dans le sélecteur.
export const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

// ---------------------------------------------------------------------------
// Réseaux de dépôt / retrait par crypto.
// DÉMO — à remplacer : frais (dans l'unité de la crypto), minimums, confirmations et délais.
// `family` sert à valider le format d'adresse (market/addresses.js) ; `memo` = mémo / tag obligatoire.
// ---------------------------------------------------------------------------
const NET = {
  btc: { id: 'btc', name: 'Bitcoin', short: 'BTC', family: 'btc', confirmations: 2, eta: 30 },
  erc20: { id: 'erc20', name: 'Ethereum (ERC20)', short: 'ERC20', family: 'evm', confirmations: 12, eta: 5 },
  bep20: { id: 'bep20', name: 'BNB Smart Chain (BEP20)', short: 'BEP20', family: 'evm', confirmations: 15, eta: 1 },
  trc20: { id: 'trc20', name: 'Tron (TRC20)', short: 'TRC20', family: 'tron', confirmations: 20, eta: 2 },
  polygon: { id: 'polygon', name: 'Polygon', short: 'POL', family: 'evm', confirmations: 128, eta: 5 },
  sol: { id: 'sol', name: 'Solana', short: 'SOL', family: 'sol', confirmations: 1, eta: 1 },
  xrp: { id: 'xrp', name: 'XRP Ledger', short: 'XRP', family: 'xrp', confirmations: 1, eta: 1, memo: true },
  ton: { id: 'ton', name: 'TON', short: 'TON', family: 'ton', confirmations: 1, eta: 1, memo: true },
  doge: { id: 'doge', name: 'Dogecoin', short: 'DOGE', family: 'doge', confirmations: 6, eta: 10 },
  ada: { id: 'ada', name: 'Cardano', short: 'ADA', family: 'ada', confirmations: 15, eta: 5 },
  avax: { id: 'avaxc', name: 'Avalanche C-Chain', short: 'AVAX-C', family: 'evm', confirmations: 1, eta: 1 },
};
const net = (key, fee, min) => ({ ...NET[key], fee, min });

export const networks = {
  btc: [net('btc', 0.00012, 0.0005)],
  eth: [net('erc20', 0.0012, 0.005), net('bep20', 0.0001, 0.005)],
  usdt: [net('trc20', 1, 5), net('erc20', 4.5, 10), net('bep20', 0.3, 5), net('polygon', 0.2, 5)],
  usdc: [net('erc20', 4.5, 10), net('polygon', 0.2, 5), net('bep20', 0.3, 5)],
  sol: [net('sol', 0.002, 0.05)],
  bnb: [net('bep20', 0.0005, 0.01)],
  xrp: [net('xrp', 0.2, 10)],
  trx: [net('trc20', 1, 10)],
  doge: [net('doge', 4, 50)],
  ton: [net('ton', 0.05, 1)],
  ada: [net('ada', 0.8, 10)],
  avax: [net('avax', 0.01, 0.1)],
  link: [net('erc20', 0.35, 1), net('bep20', 0.02, 1)],
  pol: [net('polygon', 0.1, 1)],
  dai: [net('erc20', 4.5, 10), net('polygon', 0.2, 5)],
};

// Cryptos proposées en raccourci (Recevoir / Envoyer).
export const quickCoins = ['usdt', 'btc', 'eth', 'sol', 'trx'];

// DÉMO — soldes affichés tant que l'hôte ne fournit pas window.__LANDING__.user.balances.
export const demoBalances = { usdt: 250, usdc: 120, btc: 0.05, eth: 1.2, sol: 14, bnb: 2, trx: 3000, xrp: 400, doge: 1500, ton: 35, ada: 900, avax: 6, link: 40, pol: 800, dai: 75 };

// DÉMO — à valider : frais de conversion (0,1 %) et limite d'envoi sur 24 h (en XOF).
export const swapFee = 0.001;
export const slippageOptions = [0.5, 1];
export const sendLimitXof = 10000000;

// ---------------------------------------------------------------------------
// P2P — DÉMO : acheteurs fictifs qui achètent vos USDT / USDC contre des XOF.
// `price` en XOF par unité, `available` en crypto, `limits` en XOF, `release` en minutes.
// ---------------------------------------------------------------------------
export const p2pCoins = ['usdt', 'usdc'];
export const p2pOffers = [
  { id: 'o1', merchant: 'Kora Change', verified: true, orders: 2841, completion: 99.2, release: 3, price: { usdt: 612, usdc: 610 }, available: { usdt: 18400, usdc: 5200 }, limits: { min: 5000, max: 2000000 }, methods: ['wave', 'orange'] },
  { id: 'o2', merchant: 'Baobab OTC', verified: true, orders: 1530, completion: 98.7, release: 5, price: { usdt: 611, usdc: 611 }, available: { usdt: 42000, usdc: 12000 }, limits: { min: 50000, max: 5000000 }, methods: ['wave', 'orange', 'mixx'] },
  { id: 'o3', merchant: 'Sahel Pay', verified: true, orders: 976, completion: 99.6, release: 2, price: { usdt: 610, usdc: 608 }, available: { usdt: 6100, usdc: 2400 }, limits: { min: 2000, max: 500000 }, methods: ['wave'] },
  { id: 'o4', merchant: 'Lagune Express', verified: false, orders: 214, completion: 97.1, release: 8, price: { usdt: 613, usdc: 0 }, available: { usdt: 1800, usdc: 0 }, limits: { min: 10000, max: 300000 }, methods: ['orange', 'mixx'] },
  { id: 'o5', merchant: 'Djoliba Cash', verified: true, orders: 3320, completion: 99.4, release: 4, price: { usdt: 609, usdc: 609 }, available: { usdt: 95000, usdc: 30000 }, limits: { min: 100000, max: 10000000 }, methods: ['wave', 'orange'] },
  { id: 'o6', merchant: 'Niayes P2P', verified: false, orders: 88, completion: 95.5, release: 10, price: { usdt: 614, usdc: 612 }, available: { usdt: 900, usdc: 600 }, limits: { min: 5000, max: 150000 }, methods: ['wave', 'mixx'] },
  { id: 'o7', merchant: 'Fleuve Market', verified: true, orders: 1207, completion: 98.9, release: 6, price: { usdt: 608, usdc: 607 }, available: { usdt: 27000, usdc: 9000 }, limits: { min: 20000, max: 3000000 }, methods: ['orange'] },
];

// Contact sécurité (signalements urgents).
// Adresses e-mail, découpées pour ne jamais apparaître en clair (voir ui/ZMail.vue).
export const emails = {
  support: { user: 'support', domain: 'zurumi.com' },
  security: { user: 'security', domain: 'zurumi.com' },
  press: { user: 'presse', domain: 'zurumi.com' },
  compliance: { user: 'compliance', domain: 'zurumi.com' },
  report: { user: 'signalement', domain: 'zurumi.com' },
};
export const securityEmail = emails.security;

// ---------------------------------------------------------------------------
// Espace client — DÉMO. Utilisé tant que l'hôte ne fournit pas window.__LANDING__.user.
// ---------------------------------------------------------------------------
export const USD_XOF = 607; // DÉMO — taux de référence USD → XOF

export const demoUser = {
  uid: 'ZRM-48213590',
  firstName: 'Awa',
  lastName: 'Diop',
  username: 'awa.d',
  email: 'awa.diop@example.com',
  phone: '+221 77 123 45 67',
  birthDate: '1994-03-12',
  country: 'SN',
  city: 'Dakar',
  address: '',
  language: 'fr',
  currency: 'XOF',
  avatar: null,
  createdAt: '2025-06-02',
  kyc: { level: 1, document: 'CNI ••••2041', pending: false },
  security: { passkey: false, totp: false, email: true, phone: true, password: true, antiPhishing: false },
  notifications: { transactions: true, security: true, announcements: true, marketing: false },
};

// Sessions et connexions de démonstration (lieux et appareils fictifs).
export const demoDevices = [
  { id: 'd1', device: 'desktop', name: 'Chrome · Windows', place: 'Dakar, SN', lastActive: 0, current: true },
  { id: 'd2', device: 'mobile', name: 'App Zurumi · Android', place: 'Dakar, SN', lastActive: 180 },
  { id: 'd3', device: 'mobile', name: 'Safari · iPhone', place: 'Thiès, SN', lastActive: 4320 },
];
export const demoLogins = [
  { at: 5, ip: '41.82.••.••', place: 'Dakar, SN', device: 'Chrome · Windows', ok: true },
  { at: 190, ip: '41.82.••.••', place: 'Dakar, SN', device: 'App Zurumi · Android', ok: true },
  { at: 1500, ip: '102.164.••.••', place: 'Abidjan, CI', device: 'Firefox · Linux', ok: false },
  { at: 4330, ip: '41.214.••.••', place: 'Thiès, SN', device: 'Safari · iPhone', ok: true },
  { at: 8700, ip: '41.82.••.••', place: 'Dakar, SN', device: 'Chrome · Windows', ok: true },
];

// DÉMO — à valider : limites par niveau de vérification (XOF par jour).
export const kycLevels = [
  { level: 0, buy: 0, withdraw: 0 },
  { level: 1, buy: 2000000, withdraw: 1000000 },
  { level: 2, buy: 10000000, withdraw: 5000000 },
];

// ---------------------------------------------------------------------------
// État des services — DÉMO. `status` : operational | degraded | partial | major | maintenance.
// `incidents` : jours (avant aujourd'hui) où le composant a été touché, et niveau.
// ---------------------------------------------------------------------------
export const statusComponents = [
  { group: 'platform', items: [
    { id: 'web', status: 'operational' },
    { id: 'app', status: 'operational' },
    { id: 'api', status: 'operational', incidents: [[2, 'partial']] },
  ] },
  { group: 'payments', items: [
    { id: 'wave', status: 'operational', incidents: [[23, 'degraded']] },
    { id: 'orange', status: 'degraded', incidents: [[0, 'degraded'], [41, 'partial']] },
    { id: 'mixx', status: 'operational' },
  ] },
  { group: 'networks', items: [
    { id: 'bitcoin', status: 'operational' },
    { id: 'ethereum', status: 'operational', incidents: [[57, 'degraded']] },
    { id: 'tron', status: 'operational' },
    { id: 'polygon', status: 'operational', incidents: [[12, 'maintenance']] },
    { id: 'bnb', status: 'operational' },
    { id: 'solana', status: 'operational', incidents: [[2, 'major'], [76, 'degraded']] },
  ] },
  { group: 'products', items: [
    { id: 'quickbuy', status: 'operational' },
    { id: 'convert', status: 'operational' },
    { id: 'trade', status: 'operational', incidents: [[2, 'partial']] },
    { id: 'p2p', status: 'operational' },
  ] },
  { group: 'trust', items: [
    { id: 'verify', status: 'operational' },
    { id: 'report', status: 'operational' },
  ] },
];

// Médias statiques (servis depuis public/). La vidéo WebM garde la transparence (Chrome, Firefox, Edge) ;
// le MP4 est rendu sur le fond de page (--color-bg-base) pour Safari, qui ignore la transparence WebM.
// Équipe (page À propos). Rôles et expérience traduits dans pages.about.team.roles.
// linkedin : À COMPLÉTER avec l'URL du profil (« # » en attendant).
export const team = [
  { id: 'advisor', name: '', photo: '' },
  { id: 'kamar', name: 'BELLO Kamar Dean', photo: '/images/team/kamar-dean-bello.webp', linkedin: '#' },
  { id: 'karim', name: 'MAGDY Karim', photo: '/images/team/karim-magdy.webp', linkedin: '#' },
  { id: 'yacine', name: 'MERABET Yacine', photo: '/images/team/yacine-merabet.webp', linkedin: '#' },
  { id: 'mbow', name: 'MBOW Bamba', photo: '/images/team/bamba-mbow.webp', linkedin: '#' },
  { id: 'bamba', name: 'BELLO Bamba', photo: '/images/team/bamba-bello.webp', linkedin: '#' },
  { id: 'fatoumata', name: 'NDIAYE Fatoumata Diarietou', photo: '/images/team/fatoumata-diarietou-ndiaye.webp', linkedin: '#' },
  { id: 'isandra', name: 'TAVARES Isandra', photo: '/images/team/isandra-tavares.webp', linkedin: '#' },
];

// Charte graphique officielle (kit média de la page Annonces).
export const brandKit = {
  logos: { dark: '/images/brand/zurumi-logo-fond-sombre.png', light: '/images/brand/zurumi-logo-fond-clair.png' },
  colors: [
    { id: 'purple', hex: '#5D3587' },
    { id: 'blue', hex: '#596FB7' },
    { id: 'white', hex: '#FFFFFF' },
    { id: 'ink', hex: '#0A0B10' },
  ],
  gradient: 'linear-gradient(135deg, #5D3587 0%, #596FB7 100%)',
  weights: [700, 500, 400],
};

// Logo officiel (blanc sur transparent, pour fond sombre). `compact` : sans le slogan, pour la barre de navigation.
export const brandLogo = { full: '/images/brand/zurumi-logo.webp', compact: '/images/brand/zurumi-logo-compact.webp', ratio: 960 / 229 };

export const media = {
  // Pages Connexion / Inscription : cadenas et clé (image) ; anneau de pièces chromées (vidéo transparente).
  authLogin: { src: '/images/landing/auth-cadenas-cle.webp', width: 800, height: 833 },
  authSignup: { webm: '/videos/zurumi-coins-ring.webm', mp4: '/videos/zurumi-coins-ring.mp4', poster: '/videos/zurumi-coins-ring-poster.webp', width: 640, height: 576 },
  // Section « Achetez & envoyez » : méduse qui nage (WebM transparent ; MP4 sur noir pour Safari).
  jellyfish: { webm: '/videos/meduse/meduse.webm', mp4: '/videos/meduse/meduse-noir.mp4', poster: '/videos/meduse/meduse-poster.webp' },
  // Icônes 3D des quatre garanties de la section Sécurité (256 × 256, fond transparent).
  securityIcons: {
    kyc: '/images/landing/securite/verification-identite.webp',
    custody: '/images/landing/securite/conservation.webp',
    zeroTrust: '/images/landing/securite/zero-trust.webp',
    aml: '/images/landing/securite/lbc-ft.webp',
  },
  // Section Mobile Money : schéma « liquidité profonde », une vidéo par langue (fond transparent).
  liquidity: {
    fr: { webm: '/videos/zurumi-liquidite-fr.webm', mp4: '/videos/zurumi-liquidite-fr.mp4', poster: '/videos/zurumi-liquidite-fr-poster.webp', width: 1680, height: 754 },
    en: { webm: '/videos/zurumi-liquidite-en.webm', mp4: '/videos/zurumi-liquidite-en.mp4', poster: '/videos/zurumi-liquidite-en-poster.webp', width: 1680, height: 754 },
  },
  // Section Sécurité : cadenas 3D, fond transparent.
  security: { src: '/images/landing/securite-cadenas.webp', width: 640, height: 804, alt: '' },
  // Section « Portefeuille partout » : coffre, carte et indicateurs (fond transparent).
  wallet: { src: '/images/landing/portefeuille-coffre.webp', width: 1600, height: 631, alt: '' },
  // Visuels de la section Services (public/images/landing/services/), fond transparent.
  services: {
    buy: { src: '/images/landing/services/achat-rapide.webp', width: 840, height: 586 },
    transfer: { src: '/images/landing/services/envoyer-recevoir.webp', width: 840, height: 860 },
    swap: { src: '/images/landing/services/echanger.webp', width: 840, height: 711 },
    withdraw: { src: '/images/landing/services/retirer.webp', width: 840, height: 542 },
  },
  buyFlow: { webm: '/videos/zurumi-buy-flow.webm', mp4: '/videos/zurumi-buy-flow.mp4', poster: '/videos/zurumi-buy-flow-poster.webp' },
};
