// Contenu — référence française.
// Tout le texte vit ici : les composants n'en contiennent aucun. en.js reprend exactement les mêmes clés.
// Les données sans texte (cours, paires, moyens de paiement, liens) sont dans data.js.
import accountContent from './fr-account.js';
import companyContent from './fr-company.js';
import morePages from './fr-more.js';
import { buyLimits, coins, countries, defaultCountry, defaultLinks, languages, media, pairs, paymentMethods } from './data.js';

const countryNames = {
  BJ: 'Bénin',
  BF: 'Burkina Faso',
  CI: "Côte d'Ivoire",
  GW: 'Guinée-Bissau',
  ML: 'Mali',
  NE: 'Niger',
  SN: 'Sénégal',
  TG: 'Togo',
};

/** Construit le contenu ; `linkOverrides` remplace les liens par défaut (routes réelles). */
export default function createContent(linkOverrides = {}) {
  const links = { ...defaultLinks, ...linkOverrides };

  const stores = [
    { id: 'apple', label: 'App Store', href: links.appStore },
    { id: 'google', label: 'Google Play', href: links.googlePlay },
  ];

  const common = {
    brand: 'Zurumi',
    links,
    coins,
    pairs,
    stores,
    languages,
    paymentMethods,
    buyLimits,
    countries: countries.map((c) => ({ ...c, name: countryNames[c.id] })),
    defaultCountry,
    categories: { layer1: 'Layer 1', layer2: 'Layer 2', stable: 'Stablecoins', meme: 'Mèmes', defi: 'DeFi' },
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
      { label: 'Achat rapide', href: links.quickBuy, page: 'buy' },
      { label: 'Marché', href: links.markets, page: 'markets' },
      { label: 'Trade', href: links.trade, page: 'trade' },
      {
        label: 'Transactions',
        children: [
          { label: 'Envoyer', href: links.send, icon: 'send', page: 'send' },
          { label: 'Recevoir', href: links.receive, icon: 'receive', page: 'receive' },
          { label: 'Echanger', href: links.swap, icon: 'swap', page: 'convert' },
        ],
      },
      { label: 'Retirer', href: links.withdraw, page: 'p2p', badge: 'P2P' },
    ],
    wallet: 'Portefeuille', // bouton à droite de la barre (couleur secondaire)
    language: { label: 'Langue', choose: 'Choisir la langue' },
    login: 'Connexion',
    signup: "S'inscrire",
    menu: { open: 'Ouvrir le menu', close: 'Fermer le menu' },
  };

  const footer = {
    id: 'pied-de-page',
    tagline: 'Achetez &amp; envoyez. <i>Où que vous soyez.</i>',
    columns: [
      {
        title: 'Produits',
        links: [
          { label: 'Achat rapide', href: links.quickBuy },
          { label: 'Trade', href: links.trade },
          { label: 'Envoyer', href: links.send },
          { label: 'Recevoir', href: links.receive },
          { label: 'Echanger', href: links.swap },
          { label: 'Retirer (P2P)', href: links.withdraw },
        ],
      },
      {
        title: 'Entreprise',
        links: [
          { label: 'À propos', href: links.about },
          { label: 'Carrières', href: links.careers },
          { label: 'Presse', href: links.press },
          { label: 'Zurumi Verify', href: links.verify },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: "Centre d'aide", href: links.help },
          { label: 'Nous contacter', href: links.contact },
          { label: 'Signaler un abus', href: links.report },
          { label: 'État des services', href: links.status },
        ],
      },
      {
        title: 'Légal',
        links: [
          { label: "Conditions d'utilisation", href: links.terms },
          { label: 'Confidentialité', href: links.privacy },
          { label: 'Avertissement sur les risques', href: links.risks },
          { label: 'Conformité', href: links.compliance },
        ],
      },
    ],
    socialsLabel: 'Zurumi sur les réseaux sociaux',
    socials: [
      { id: 'facebook', label: 'Facebook', href: links.facebook },
      { id: 'x', label: 'X (Twitter)', href: links.x },
      { id: 'instagram', label: 'Instagram', href: links.instagram },
      { id: 'linkedin', label: 'LinkedIn', href: links.linkedin },
      { id: 'telegram', label: 'Telegram', href: links.telegram },
      { id: 'tiktok', label: 'TikTok', href: links.tiktok },
      { id: 'youtube', label: 'YouTube', href: links.youtube },
    ],
    copyright: '© 2026 Zurumi. Tous droits réservés.',
    backToTop: { label: 'Haut de page', href: '#top' },
    // À retirer à la mise en ligne.
    disclaimer:
      'Démo de design : cours, montants, taux et chiffres affichés sont fictifs. Le lien du QR code est provisoire. Les mentions de sécurité et de conformité sont à valider avant mise en ligne.',
  };

  // Page d'accueil : liste ordonnée de sections (ajouter, retirer, réordonner ici).
  const sections = [
    {
      id: 'accueil',
      type: 'hero',
      title: 'La crypto,<br>en <i>FCFA</i>',
      text: 'Achetez, envoyez et échangez vos cryptos avec Wave, Orange Money et vos moyens de paiement habituels.',
      stats: [
        { label: 'Moyens de paiement', value: 8 },
        { label: 'Achat en', prefix: '< ', value: 2, suffix: ' min' },
        { label: 'Disponibilité', value: 24, suffix: '/7' },
        { label: 'Devise native', text: 'XOF' },
      ],
      rates: { interval: 2200, count: 4 }, // rotation des cartes de cours (A20)
    },
    {
      id: 'cryptos',
      type: 'coins',
      title: 'Vos cryptos<br><i>préférées,</i> en un geste',
      cta: { label: "S'inscrire", href: links.signup },
      speeds: [38, 46], // secondes par boucle, une valeur par rangée
    },
    {
      id: 'application',
      type: 'app',
      title: 'Tout-en-un,<br>une interface <i>puissante</i>',
      text: 'Une application mobile complète, avec tous les outils pour gérer vos cryptos partout, à tout moment.',
      perks: [
        { icon: 'plus', title: 'Frais transparents', text: 'Le montant reçu est affiché avant de payer.' },
        { icon: 'bolt', title: 'Exécution rapide', text: 'Vos achats sont crédités en quelques instants.' },
        { icon: 'card', title: 'Mobile Money intégré', text: 'Wave, Orange Money, Mixx by Yas et plus encore.' },
        { icon: 'shield', title: 'Portefeuille sécurisé', text: 'Vos actifs protégés, vos accès vérifiés.' }, // À VALIDER (conformité)
      ],
      video: { play: 'Lire l’animation', pause: 'Mettre l’animation en pause', label: 'Démonstration de l’application Zurumi : achat de 20 USDT payés avec Orange Money, de l’accueil jusqu’au paiement réussi.', ...media.buyFlow },
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
      title: "Tout ce qu'il faut<br>pour <i>vos cryptos</i>",
      more: 'En savoir plus',
      // DÉMO — à remplacer : montants, taux, frais et adresses fictifs.
      items: [
        {
          title: 'Achat rapide.',
          text: 'Achetez vos cryptos en FCFA avec Mobile Money, en quelques secondes.',
          href: links.quickBuy,
          image: media.services.buy,
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
          image: media.services.transfer,
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
          image: media.services.swap,
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
          image: media.services.withdraw,
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
      title: 'Payez en <b>Mobile Money,</b> <i>recevez vos cryptos</i>',
      text: 'Pas de carte bancaire, pas de virement international. Vos moyens de paiement du quotidien suffisent.',
      perks: [
        { icon: 'pin', title: 'Moyens de paiement locaux', text: "Wave, Orange Money, Mixx by Yas et d'autres opérateurs de la zone." },
        { icon: 'pulse', title: 'Suivi en temps réel', text: 'Chaque opération est suivie, du paiement à la réception.' },
        { icon: 'coin', title: 'Montants en FCFA', text: 'Prix, frais et soldes affichés dans votre devise.' },
      ],
      video: { label: 'Animation : stablecoins, devises et cryptoactifs convergent vers un réservoir de liquidité profonde, puis sont redistribués au règlement.', play: 'Lire l’animation', pause: 'Mettre l’animation en pause', ...media.liquidity.fr },
    },
    {
      id: 'securite',
      type: 'security',
      title: 'Une sécurité<br><i>de haut niveau</i>', // À VALIDER (conformité)
      // À VALIDER (conformité) — formulations provisoires, aucune affirmation de licence ou d'agrément.
      items: [
        { icon: 'id', image: media.securityIcons.kyc, title: "Vérification d'identité", text: 'Parcours KYC pour protéger chaque compte' },
        { icon: 'vault', image: media.securityIcons.custody, title: 'Conservation spécialisée', text: 'Garde des actifs confiée à un prestataire dédié' },
        { icon: 'lock', image: media.securityIcons.zeroTrust, title: 'Protection Zero Trust', text: 'Accès contrôlés et infrastructure surveillée' },
        { icon: 'scale', image: media.securityIcons.aml, title: 'LBC / FT', text: 'Contrôles alignés sur les standards du GAFI' },
      ],
      image: media.security,
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
    },
    {
      id: 'portefeuille',
      type: 'globe',
      title: 'Vos cryptos, partout,<br><b>tout le temps</b>',
      text: 'Une application mobile complète avec tous les outils dont vous avez besoin.',
      features: [
        { icon: 'chart', label: 'Cours en temps réel' },
        { icon: 'list', label: 'Historique détaillé des transactions' },
        { icon: 'bell', label: 'Notifications instantanées' },
        { icon: 'fingerprint', label: 'Connexion biométrique sécurisée' },
      ],
      video: { label: 'Animation : pièces de cryptomonnaies en chrome noir qui tournent sur elles-mêmes.', play: 'Lire l’animation', pause: 'Mettre l’animation en pause', ...media.coins },
    },
  ];

  // Textes partagés par les pages de connexion et d'inscription.
  const auth = {
    or: 'Ou continuez avec',
    providers: [
      { id: 'google', label: 'Google' },
      { id: 'apple', label: 'Apple' },
    ],
    identifier: {
      label: "Mode d'identification",
      tabs: { email: 'E-mail', phone: 'Numéro mobile' },
      email: 'Adresse e-mail',
      emailPlaceholder: 'nom@exemple.com',
      phone: 'Numéro mobile',
      phonePlaceholder: '77 123 45 67',
      country: 'Indicatif pays',
      countrySearch: 'Rechercher un pays',
      errors: {
        email: 'Saisissez une adresse e-mail valide.',
        phone: 'Saisissez un numéro mobile valide (8 à 10 chiffres).',
      },
    },
    password: { label: 'Mot de passe', show: 'Afficher le mot de passe', hide: 'Masquer le mot de passe' },
    // À retirer quand les formulaires sont branchés au serveur.
    demo: "Démo : l'authentification n'est pas encore branchée au serveur.",
  };

  const pages = {
    home: {
      meta: {
        title: 'Zurumi — La crypto, en FCFA',
        description: 'Achetez, envoyez et échangez vos cryptos avec Wave, Orange Money et vos moyens de paiement habituels.',
      },
    },

    markets: {
      meta: {
        title: 'Marchés — Zurumi',
        description: 'Cours des cryptos en FCFA : tendances, nouveautés et meilleures performances.',
      },
      title: 'Aperçu des <i>marchés</i>',
      text: 'Suivez les cours en FCFA et passez à l’achat en un geste.',
      highlights: [
        { id: 'trending', title: 'Tendances' },
        { id: 'newest', title: 'Nouveautés' },
        { id: 'gainers', title: 'Meilleures performances' },
      ],
      showInTable: 'Afficher dans le tableau',
      tabs: { label: 'Listes', favorites: 'Favoris', all: 'Tous' },
      search: { label: 'Rechercher une crypto', placeholder: 'Rechercher' },
      chips: { label: 'Filtrer par catégorie', all: 'Toutes', new: 'Nouveautés' },
      table: {
        title: 'Tous les marchés',
        text: 'Cours, variations et volumes, mis à jour en continu.',
        caption: 'Cours des cryptomonnaies en XOF',
        cols: {
          rank: '#',
          name: 'Nom',
          price: 'Prix',
          change: 'Variation',
          chart: 'Tendance 24 h',
          cap: 'Capitalisation',
          volume: 'Volume 24 h',
          action: 'Action',
        },
        periods: [
          { id: '1h', label: '1 h' },
          { id: '4h', label: '4 h' },
          { id: '24h', label: '24 h' },
        ],
        periodLabel: 'Période de la variation',
        sort: 'Trier par {col}',
        favorite: { add: 'Ajouter {name} aux favoris', remove: 'Retirer {name} des favoris' },
        buy: 'Acheter',
        trade: 'Trader',
        empty: {
          favorites: "Aucun favori pour l'instant. Touchez l'étoile d'une crypto pour l'ajouter ici.",
          search: 'Aucune crypto ne correspond à « {query} ».',
        },
      },
      // DÉMO — à retirer quand les cours viennent de l'API.
      note: 'Démo : cours, capitalisations et volumes fictifs, simulés dans le navigateur.',
    },

    buy: {
      meta: {
        title: 'Achat rapide — Zurumi',
        description: 'Achetez et vendez vos cryptos en FCFA avec Wave, Orange Money ou Mixx by Yas.',
      },
      title: 'Achetez et vendez<br>vos cryptos <i>en quelques secondes</i>',
      text: 'Payez en FCFA avec Wave, Orange Money ou Mixx by Yas. Le montant reçu est affiché avant de payer.',
      methodsLabel: 'Moyens de paiement acceptés',
      perks: [
        { icon: 'coin', text: 'Montants affichés en FCFA' },
        { icon: 'bolt', text: 'Crédité en quelques instants' },
        { icon: 'shield', text: 'Portefeuille sécurisé' }, // À VALIDER (conformité)
      ],
      widget: {
        label: 'Achat rapide',
        tabs: { buy: 'Acheter', sell: 'Vendre' },
        spend: 'Je dépense',
        receive: 'Je reçois',
        payWith: 'Payer avec',
        receiveOn: 'Recevoir sur',
        crypto: 'Crypto',
        cryptoSearch: 'Rechercher une crypto',
        method: 'Moyen de paiement',
        reference: 'Prix de référence',
        limits: 'Entre {min} et {max}',
        cta: { buy: 'Acheter {ticker}', sell: 'Vendre {ticker}' },
        errors: {
          invalid: 'Saisissez un montant valide.',
          min: 'Montant minimum : {min}',
          max: 'Montant maximum : {max}',
        },
        note: 'Le montant définitif est confirmé avant le paiement.',
        demo: "Démo : le paiement n'est pas encore branché au serveur.",
        empty: 'Aucun résultat',
      },
      steps: {
        title: 'Comment <i>ça marche</i>',
        items: [
          { title: 'Choisissez un montant.', text: 'Le montant en crypto est calculé au taux affiché.' },
          { title: 'Payez en Mobile Money.', text: 'Validez le paiement depuis Wave, Orange Money ou Mixx by Yas.' },
          { title: 'Recevez vos cryptos.', text: 'Elles sont créditées sur votre portefeuille Zurumi en quelques instants.' },
        ],
      },
      // À VALIDER (conformité) — réponses provisoires.
      faq: {
        title: 'Questions <i>fréquentes</i>',
        items: [
          {
            q: 'Quels moyens de paiement puis-je utiliser ?',
            a: 'Wave, Orange Money et Mixx by Yas. Les montants sont affichés et payés en FCFA.',
          },
          {
            q: 'Combien de temps faut-il pour recevoir mes cryptos ?',
            a: 'Une fois le paiement validé, vos cryptos sont créditées en quelques instants.',
          },
          {
            q: 'Quel montant vais-je recevoir ?',
            a: 'Le montant reçu est affiché avant de payer. Il est confirmé une dernière fois avant la validation.',
          },
          {
            q: 'Faut-il un compte ?',
            a: "Oui. Un compte vérifié est nécessaire pour acheter, vendre ou retirer. L'inscription prend quelques minutes.",
          },
        ],
      },
    },

    trade: {
      meta: {
        title: 'Trade — Zurumi',
        description: 'Graphique, carnet d’ordres et passage d’ordres au comptant sur les paires crypto.',
      },
      pair: { label: 'Choisir une paire', search: 'Rechercher une paire', empty: 'Aucune paire' },
      stats: {
        label: 'Statistiques 24 h',
        change: 'Variation 24 h',
        high: 'Haut 24 h',
        low: 'Bas 24 h',
        volume: 'Volume 24 h ({ticker})',
      },
      strip: 'Paires populaires',
      chart: {
        tabs: { chart: 'Graphique', info: 'Infos' },
        timeframes: [
          { id: '15m', label: '15 min' },
          { id: '1h', label: '1 h' },
          { id: '4h', label: '4 h' },
          { id: '1d', label: '1 J' },
          { id: '1w', label: '1 S' },
        ],
        timeframeLabel: 'Unité de temps',
        label: 'Graphique en chandeliers {pair}, unité {tf}',
        ohlc: { o: 'O', h: 'H', l: 'B', c: 'F', v: 'Vol' },
        info: {
          name: 'Nom',
          symbol: 'Symbole',
          category: 'Catégorie',
          price: 'Prix (XOF)',
          cap: 'Capitalisation (XOF)',
          volume: 'Volume 24 h (XOF)',
        },
      },
      book: {
        tabs: { book: "Carnet d'ordres", trades: 'Transactions récentes' },
        price: 'Prix ({ticker})',
        amount: 'Montant ({ticker})',
        total: 'Total ({ticker})',
        time: 'Heure',
        views: { label: 'Affichage', both: 'Achats et ventes', bids: 'Achats seulement', asks: 'Ventes seulement' },
        grouping: 'Regroupement des prix',
        pick: 'Utiliser le prix {price}',
        ratio: { label: 'Répartition achats / ventes', buy: 'A', sell: 'V' },
      },
      form: {
        label: "Passer un ordre",
        sides: { buy: 'Acheter', sell: 'Vendre' },
        types: { label: "Type d'ordre", limit: 'Limite', market: 'Marché' },
        price: 'Prix',
        marketPrice: 'Meilleur prix du marché',
        amount: 'Montant',
        total: 'Total',
        percent: 'Part du solde disponible',
        available: 'Disponible',
        max: { buy: 'Achat max', sell: 'Vente max' },
        increase: 'Augmenter le prix',
        decrease: 'Diminuer le prix',
        login: 'Se connecter',
        signup: "S'inscrire",
        hint: 'Connectez-vous pour passer un ordre.',
        submit: { buy: 'Acheter {ticker}', sell: 'Vendre {ticker}' },
      },
      orders: {
        label: 'Mes ordres',
        tabs: [
          { id: 'open', label: 'Ordres ouverts (0)' },
          { id: 'history', label: 'Historique des ordres' },
          { id: 'trades', label: 'Historique des trades' },
          { id: 'assets', label: 'Actifs' },
        ],
        empty: '{login} ou {signup} pour voir vos ordres.',
        login: 'Connectez-vous',
        signup: 'inscrivez-vous',
      },
      accounts: { title: 'Comptes', trading: 'Compte de trading', deposit: 'Déposer', transfer: 'Transférer' },
      // DÉMO — à retirer quand le carnet et les transactions viennent de l'API.
      note: 'Démo : graphique, carnet et transactions simulés dans le navigateur.',
    },

    login: {
      meta: {
        title: 'Connexion — Zurumi',
        description: 'Connectez-vous à votre compte Zurumi avec votre e-mail ou votre numéro mobile.',
      },
      visual: {
        title: 'Vos cryptos,<br>en toute <i>confiance.</i>',
        text: 'Achetez, envoyez et retirez en FCFA depuis un seul portefeuille.',
      },
      title: 'Se connecter',
      next: 'Suivant',
      submit: 'Se connecter',
      edit: 'Modifier',
      forgot: 'Mot de passe oublié ?',
      noAccount: 'Pas encore de compte ?',
      signup: "S'inscrire",
      errors: { password: 'Saisissez votre mot de passe.' },
    },

    signup: {
      meta: {
        title: 'Inscription — Zurumi',
        description: 'Créez votre compte Zurumi en quelques minutes avec votre e-mail ou votre numéro mobile.',
      },
      visual: {
        title: 'Votre compte,<br>en <i>quelques minutes.</i>',
        perks: [
          'Achetez en FCFA avec Wave, Orange Money ou Mixx by Yas',
          'Le montant reçu est affiché avant de payer',
          'Envoyez, échangez et retirez depuis un seul portefeuille',
        ],
      },
      title: 'Créer un compte',
      step: 'Étape {n}/{total}',
      progress: 'Progression de l’inscription',
      continue: 'Continuer',
      back: 'Retour',
      terms: "J'ai lu et j'accepte les {terms} et la {privacy}.",
      termsLink: "Conditions d'utilisation",
      privacyLink: 'Politique de confidentialité',
      verify: {
        title: 'Vérifiez votre {method}',
        methods: { email: 'adresse e-mail', phone: 'numéro' },
        text: 'Saisissez le code à 6 chiffres envoyé à {target}.',
        label: 'Code de vérification',
        digit: 'Chiffre {n} sur 6',
        resend: 'Renvoyer le code',
        resendIn: 'Renvoyer le code dans {s} s',
        resent: 'Un nouveau code a été envoyé.',
        submit: 'Vérifier',
      },
      password: {
        title: 'Choisissez un mot de passe',
        confirm: 'Confirmer le mot de passe',
        rulesLabel: 'Règles du mot de passe',
        rules: { length: '8 caractères minimum', upper: 'Une majuscule', lower: 'Une minuscule', digit: 'Un chiffre' },
        submit: 'Créer mon compte',
      },
      done: {
        title: 'Votre compte est prêt',
        text: 'Vous pouvez maintenant faire votre premier achat en FCFA.',
        cta: 'Faire mon premier achat',
      },
      errors: {
        terms: 'Acceptez les conditions pour continuer.',
        code: 'Saisissez les 6 chiffres du code.',
        password: 'Le mot de passe ne respecte pas toutes les règles.',
        confirm: 'Les mots de passe ne correspondent pas.',
      },
      hasAccount: 'Déjà inscrit ?',
      login: 'Se connecter',
    },
  };

  const more = morePages(links);
  const acc = accountContent(links);
  nav.account = acc.navAccount;
  return { locale: 'fr', common, nav, footer, sections, auth, pages: { ...pages, ...more.pages, ...acc.pages, ...companyContent() }, legal: more.legal, notifications: acc.notifications, account: acc.account };
}
