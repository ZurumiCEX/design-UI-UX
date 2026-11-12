// Contenu de la landing — référence française.
// Tout le texte, les listes, les étapes et les liens vivent ici : les composants n'en contiennent aucun.
// Ajouter, retirer ou réordonner une section = modifier le tableau `sections`.

// Liens par défaut. Dans Laravel, injectez les routes nommées via window.__LANDING__.links (voir main.js).
// Les « # » sont des routes à brancher : n'inventez pas d'URL.
export const defaultLinks = {
  home: '#top',
  signup: '#',
  login: '#',
  quickBuy: '#',
  send: '#',
  receive: '#',
  swap: '#',
  withdraw: '#',
  wallet: '#',
  search: '#',
  appStore: '#',
  googlePlay: '#',
  // À REMPLACER — lien de téléchargement réel, encodé dans le QR code.
  download: 'https://example.com/zurumi-app',
};

/** Construit le contenu ; `linkOverrides` remplace les liens par défaut (routes réelles). */
export default function createContent(linkOverrides = {}) {
  const links = { ...defaultLinks, ...linkOverrides };

  // DÉMO — à remplacer : cours et variations fictifs, à brancher sur une API plus tard.
  // `tone` est une donnée de présentation (couleur de pastille propre à chaque actif).
  const coins = [
    {
      id: 'btc',
      glyph: '₿',
      name: 'Bitcoin',
      ticker: 'BTC',
      price: '58 412 300 XOF',
      change: '+1,84 %',
      up: true,
      tone: '#F7931A',
    },
    {
      id: 'eth',
      glyph: 'Ξ',
      name: 'Ethereum',
      ticker: 'ETH',
      price: '1 472 800 XOF',
      change: '+0,92 %',
      up: true,
      tone: '#596FB7',
    },
    { id: 'usdt', glyph: '₮', name: 'Tether', ticker: 'USDT', price: '607 XOF', change: '+0,02 %', up: true, tone: '#26A17B' },
    { id: 'sol', glyph: 'S', name: 'Solana', ticker: 'SOL', price: '98 450 XOF', change: '−1,61 %', up: false, tone: '#5D3587' },
    { id: 'bnb', glyph: 'B', name: 'BNB', ticker: 'BNB', price: '371 200 XOF', change: '−0,47 %', up: false, tone: '#F3BA2F' },
    { id: 'usdc', glyph: '$', name: 'USD Coin', ticker: 'USDC', price: '606 XOF', change: '+0,01 %', up: true, tone: '#2775CA' },
    { id: 'trx', glyph: 'T', name: 'Tron', ticker: 'TRX', price: '172 XOF', change: '+2,10 %', up: true, tone: '#EB0029' },
    { id: 'pol', glyph: 'P', name: 'Polygon', ticker: 'POL', price: '264 XOF', change: '−0,88 %', up: false, tone: '#8247E5' },
  ];

  const stores = [
    { id: 'apple', label: 'App Store', href: links.appStore },
    { id: 'google', label: 'Google Play', href: links.googlePlay },
  ];

  const common = {
    brand: 'Zurumi',
    links,
    coins,
    stores,
    download: {
      label: "Télécharger l'app",
      or: 'ou via',
      qrAlt: "QR code vers le téléchargement de l'application Zurumi",
      url: links.download,
    },
  };

  const nav = {
    label: 'Navigation principale',
    home: 'Zurumi — accueil',
    items: [
      { label: 'Achat rapide', href: links.quickBuy },
      {
        label: 'Transactions',
        children: [
          { label: 'Envoyer', href: links.send, icon: 'send' },
          { label: 'Recevoir', href: links.receive, icon: 'receive' },
          { label: 'Echanger', href: links.swap, icon: 'swap' },
        ],
      },
      { label: 'Retirer', href: links.withdraw },
      { label: 'Portefeuille', href: links.wallet },
    ],
    search: 'Rechercher',
    language: { current: 'FR', label: 'Choisir la langue' },
    login: 'Connexion',
    signup: "S'inscrire",
    menu: { open: 'Ouvrir le menu', close: 'Fermer le menu' },
  };

  const sections = [
    {
      id: 'top',
      type: 'hero',
      title: 'La crypto,<br>en <i>FCFA</i>',
      text: 'Achetez, envoyez et échangez vos cryptos avec Wave, Orange Money et vos moyens de paiement habituels.',
      form: { placeholder: 'E-mail / Numéro mobile', submit: "S'inscrire", action: links.signup },
      social: {
        label: 'ou via',
        providers: [
          { id: 'apple', label: 'Continuer avec Apple', href: links.signup },
          { id: 'google', label: 'Continuer avec Google', href: links.signup },
        ],
      },
      // DÉMO — à remplacer : statistiques fictives.
      stats: [
        { label: 'Moyens de paiement', value: 8 },
        { label: 'Achat en', prefix: '< ', value: 2, suffix: ' min' },
        { label: 'Disponibilité', value: 24, suffix: '/7' },
        { label: 'Devise native', text: 'XOF' },
      ],
      dashboard: {
        label: 'Aperçu du tableau de bord Zurumi',
        menu: ['Achat rapide', 'Transactions', 'Retirer', 'Portefeuille'],
        quote: 'XOF',
        timeframes: ['15 min', '1 h', '4 h', '1 j', '1 sem'],
      },
    },
    {
      id: 'cryptos',
      type: 'coins',
      tag: 'Paiement Mobile Money',
      title: 'Vos cryptos<br><i>préférées,</i> en un geste',
      cta: { label: "S'inscrire", href: links.signup },
      speeds: [38, 46], // secondes par boucle, une valeur par rangée
    },
    {
      id: 'application',
      type: 'app',
      tag: 'Acheter · Envoyer · Echanger',
      title: 'Tout-en-un,<br>une interface <i>puissante</i>',
      text: 'Une application mobile complète, avec tous les outils pour gérer vos cryptos partout, à tout moment.',
      perks: [
        { icon: 'plus', title: 'Frais transparents', text: 'Le montant reçu est affiché avant de payer.' },
        { icon: 'bolt', title: 'Exécution rapide', text: 'Vos achats sont crédités en quelques instants.' },
        { icon: 'card', title: 'Mobile Money intégré', text: 'Wave, Orange Money, Mixx by Yas et plus encore.' },
        { icon: 'shield', title: 'Portefeuille sécurisé', text: 'Vos actifs protégés, vos accès vérifiés.' }, // À VALIDER (conformité)
      ],
      // DÉMO — à remplacer : montants et taux fictifs.
      phone: {
        label: "Aperçu de l'application Zurumi : écran Achat rapide",
        tag: 'Achat rapide',
        title: 'Acheter<br>en un instant',
        fields: [
          { label: 'Vous payez', value: '50 000', unit: 'XOF' },
          { label: 'Vous recevez', value: '≈ 82,40', unit: 'USDT' },
        ],
        methods: ['Wave', 'Orange Money', 'Mixx'],
        cta: 'Continuer',
        ticker: { label: 'BTC', change: '+1,84 %' },
      },
      image: null, // capture réelle de l'application, voir public/images/landing/
    },
    {
      id: 'telecharger',
      type: 'sky',
      title: 'Achetez &amp; envoyez.<br>Où que vous <i>soyez.</i>',
      image: null,
    },
    {
      id: 'services',
      type: 'products',
      tag: 'Nos services',
      title: "Tout ce qu'il faut<br>pour <i>vos cryptos</i>",
      more: 'En savoir plus',
      // DÉMO — à remplacer : montants, taux, frais et adresses fictifs.
      items: [
        {
          title: 'Achat rapide.',
          text: 'Achetez vos cryptos en FCFA avec Mobile Money, en quelques secondes.',
          href: links.quickBuy,
          ui: {
            title: 'Achat rapide',
            meta: '1 USDT ≈ 607 XOF',
            rows: [
              { label: 'Vous payez', value: '50 000 XOF', coin: 'F' },
              { label: 'Vous recevez', value: '82,40 USDT', coin: '₮' },
            ],
            cta: 'Payer avec Wave',
          },
        },
        {
          title: 'Envoyer & Recevoir.',
          text: "Transférez vers n'importe quel portefeuille, recevez par adresse ou QR code.",
          href: links.send,
          ui: {
            title: 'Envoyer · Recevoir',
            meta: 'Réseau Polygon',
            rows: [
              { label: 'Destinataire', value: '0x7a3F…c91E', mono: true, ok: '✓ vérifiée' },
              { label: 'Montant', value: '25,00 USDT', coin: '₮' },
              { label: 'Frais réseau', value: '0,02 USDT', note: '≈ 1 min' },
            ],
            cta: 'Envoyer',
          },
        },
        {
          title: 'Echanger.',
          text: 'Convertissez une crypto en une autre, au taux affiché, sans surprise.',
          href: links.swap,
          ui: {
            title: 'Echanger',
            meta: 'Taux en direct',
            rows: [
              { label: 'De', value: '100 USDT', coin: '₮' },
              { divider: '⇅' },
              { label: 'Vers', value: '0,0412 ETH', coin: 'Ξ' },
            ],
            cta: 'Echanger',
          },
        },
        {
          title: 'Retirer.',
          text: 'Récupérez vos fonds en FCFA directement sur votre compte Mobile Money.',
          href: links.withdraw,
          ui: {
            title: 'Retirer',
            meta: 'Vers Mobile Money',
            rows: [
              { label: 'Vous retirez', value: '40 000 XOF', coin: 'F' },
              { option: 'Wave', selected: true },
              { option: 'Orange Money' },
            ],
            cta: 'Retirer',
          },
        },
      ],
    },
    {
      id: 'mobile-money',
      type: 'mobileMoney',
      tag: 'Du Mobile Money à la crypto',
      title: 'Payez en <b>Mobile Money</b>, <i>recevez vos cryptos</i>',
      text: 'Pas de carte bancaire, pas de virement international. Vos moyens de paiement du quotidien suffisent.',
      // Pièces flottantes : position (% de la scène), amplitude au scroll (px) et décalage du flottement (s).
      floating: [
        { glyph: 'F', x: 22, y: 52, size: 72, drift: -70, delay: 0 },
        { glyph: '₮', x: 37, y: 12, size: 64, drift: 46, delay: -1.2 },
        { glyph: '₿', x: 57, y: 4, size: 74, drift: -34, delay: -2.4 },
        { glyph: 'Ξ', x: 75, y: 20, size: 62, drift: 62, delay: -3.1 },
        { glyph: 'F', x: 82, y: 62, size: 68, drift: -52, delay: -4 },
      ],
      perks: [
        {
          icon: 'pin',
          title: 'Moyens de paiement locaux',
          text: "Wave, Orange Money, Mixx by Yas et d'autres opérateurs de la zone.",
        },
        { icon: 'pulse', title: 'Suivi en temps réel', text: 'Chaque opération est suivie, du paiement à la réception.' },
        { icon: 'coin', title: 'Montants en FCFA', text: 'Prix, frais et soldes affichés dans votre devise.' },
      ],
      cta: { label: 'Faire mon premier achat', href: links.quickBuy },
      image: null,
    },
    {
      id: 'securite',
      type: 'security',
      tag: 'Sécurité & conformité',
      title: 'Une sécurité<br><i>de haut niveau</i>', // À VALIDER (conformité)
      // À VALIDER (conformité) — formulations provisoires, aucune affirmation de licence ou d'agrément.
      items: [
        { icon: 'id', title: "Vérification d'identité", text: 'Parcours KYC pour protéger chaque compte' },
        { icon: 'vault', title: 'Conservation spécialisée', text: 'Garde des actifs confiée à un prestataire dédié' },
        { icon: 'lock', title: 'Protection Zero Trust', text: 'Accès contrôlés et infrastructure surveillée' },
        { icon: 'scale', title: 'LBC / FT', text: 'Contrôles alignés sur les standards du GAFI' },
      ],
      image: null,
    },
    {
      id: 'etapes',
      type: 'steps',
      title: 'Commencez<br>en <i>quelques minutes</i>',
      text: 'Un compte, un dépôt Mobile Money, et vous êtes prêt.',
      cta: { label: "S'inscrire", href: links.signup },
      interval: 3400, // ms entre deux étapes (A19)
      listLabel: 'Étapes pour commencer',
      items: [
        { title: 'Créez votre compte.', text: 'Inscrivez-vous avec votre e-mail ou votre numéro mobile.' },
        { title: 'Déposez des fonds.', text: 'Alimentez votre compte avec Wave, Orange Money ou en crypto.' },
        { title: 'Achetez et envoyez.', text: 'Achat rapide, envoi, échange et retrait depuis un seul portefeuille.' },
      ],
      orbit: ['₿', 'Ξ', '₮', 'S', 'B', '$', 'T', 'P', 'F', '◆'],
    },
    {
      id: 'portefeuille',
      type: 'globe',
      tag: 'Votre portefeuille partout',
      title: 'Vos cryptos, partout,<br><b>tout le temps</b>',
      text: 'Une application mobile complète avec tous les outils dont vous avez besoin.',
      features: [
        { icon: 'chart', label: 'Cours en temps réel' },
        { icon: 'list', label: 'Historique détaillé des transactions' },
        { icon: 'bell', label: 'Notifications instantanées' },
        { icon: 'fingerprint', label: 'Connexion biométrique sécurisée' },
      ],
      rates: { interval: 2200, count: 4 }, // rotation des cartes de cours (A20)
    },
    {
      id: 'pied-de-page',
      type: 'footer',
      tagline: 'Achetez &amp; envoyez. <i>Où que vous soyez.</i>',
      columns: [
        {
          title: 'Produits',
          links: [
            { label: 'Achat rapide', href: links.quickBuy },
            { label: 'Envoyer', href: links.send },
            { label: 'Recevoir', href: links.receive },
            { label: 'Echanger', href: links.swap },
            { label: 'Retirer', href: links.withdraw },
          ],
        },
        {
          title: 'Entreprise',
          links: [
            { label: 'À propos', href: '#' },
            { label: 'Carrières', href: '#' },
            { label: 'Presse', href: '#' },
            { label: 'Zurumi Verify', href: '#' },
          ],
        },
        {
          title: 'Support',
          links: [
            { label: "Centre d'aide", href: '#' },
            { label: 'Nous contacter', href: '#' },
            { label: 'Signaler un abus', href: '#' },
            { label: 'État des services', href: '#' },
          ],
        },
        {
          title: 'Légal',
          links: [
            { label: "Conditions d'utilisation", href: '#' },
            { label: 'Confidentialité', href: '#' },
            { label: 'Avertissement sur les risques', href: '#' },
            { label: 'Conformité', href: '#' },
          ],
        },
      ],
      socials: [
        { label: 'Instagram', href: '#' },
        { label: 'YouTube', href: '#' },
        { label: 'X (Twitter)', href: '#' },
        { label: 'Facebook', href: '#' },
      ],
      copyright: '© 2026 Zurumi. Tous droits réservés.',
      backToTop: { label: 'Haut de page', href: '#top' },
      // À retirer à la mise en ligne.
      disclaimer:
        'Démo de design : cours, montants, taux et chiffres affichés sont fictifs. Le lien du QR code est provisoire. Les mentions de sécurité et de conformité sont à valider avant mise en ligne.',
    },
  ];

  return { locale: 'fr', common, nav, sections };
}
