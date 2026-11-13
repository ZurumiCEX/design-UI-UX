// Content — English. Same keys as fr.js (the reference). Keep both files in sync.
import accountContent from './en-account.js';
import companyContent from './en-company.js';
import morePages from './en-more.js';
import { buyLimits, coins, countries, defaultCountry, defaultLinks, languages, media, pairs, paymentMethods } from './data.js';

const countryNames = {
  BJ: 'Benin',
  BF: 'Burkina Faso',
  CI: "Côte d'Ivoire",
  GW: 'Guinea-Bissau',
  ML: 'Mali',
  NE: 'Niger',
  SN: 'Senegal',
  TG: 'Togo',
};

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
    categories: { layer1: 'Layer 1', layer2: 'Layer 2', stable: 'Stablecoins', meme: 'Memes', defi: 'DeFi' },
    download: {
      label: 'Download the app',
      or: 'or via',
      qrAlt: 'QR code to download the Zurumi app',
      url: links.download,
    },
  };

  const nav = {
    label: 'Main navigation',
    home: 'Zurumi — home',
    items: [
      { label: 'Quick buy', href: links.quickBuy, page: 'buy' },
      { label: 'Market', href: links.markets, page: 'markets' },
      { label: 'Trade', href: links.trade, page: 'trade' },
      {
        label: 'Transactions',
        children: [
          { label: 'Send', href: links.send, icon: 'send', page: 'send' },
          { label: 'Receive', href: links.receive, icon: 'receive', page: 'receive' },
          { label: 'Swap', href: links.swap, icon: 'swap', page: 'convert' },
        ],
      },
      { label: 'Withdraw', href: links.withdraw, page: 'p2p', badge: 'P2P' },
    ],
    wallet: 'Wallet', // bouton à droite de la barre (couleur secondaire)
    language: { label: 'Language', choose: 'Choose language' },
    login: 'Log in',
    signup: 'Sign up',
    menu: { open: 'Open menu', close: 'Close menu' },
  };

  const footer = {
    id: 'pied-de-page',
    tagline: 'Buy &amp; send. <i>Wherever you are.</i>',
    columns: [
      {
        title: 'Products',
        links: [
          { label: 'Quick buy', href: links.quickBuy },
          { label: 'Trade', href: links.trade },
          { label: 'Send', href: links.send },
          { label: 'Receive', href: links.receive },
          { label: 'Swap', href: links.swap },
          { label: 'Withdraw (P2P)', href: links.withdraw },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: links.about },
          { label: 'Careers', href: links.careers },
          { label: 'Press', href: links.press },
          { label: 'Zurumi Verify', href: links.verify },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Help center', href: links.help },
          { label: 'Contact us', href: links.contact },
          { label: 'Report abuse', href: links.report },
          { label: 'Service status', href: links.status },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of use', href: links.terms },
          { label: 'Privacy', href: links.privacy },
          { label: 'Risk warning', href: links.risks },
          { label: 'Compliance', href: links.compliance },
        ],
      },
    ],
    socialsLabel: 'Zurumi on social media',
    socials: [
      { id: 'facebook', label: 'Facebook', href: links.facebook },
      { id: 'x', label: 'X (Twitter)', href: links.x },
      { id: 'instagram', label: 'Instagram', href: links.instagram },
      { id: 'linkedin', label: 'LinkedIn', href: links.linkedin },
      { id: 'telegram', label: 'Telegram', href: links.telegram },
      { id: 'tiktok', label: 'TikTok', href: links.tiktok },
      { id: 'youtube', label: 'YouTube', href: links.youtube },
    ],
    copyright: '© 2026 Zurumi. All rights reserved.',
    backToTop: { label: 'Back to top', href: '#top' },
    disclaimer:
      'Design demo: prices, amounts, rates and figures shown are fictitious. The QR code link is temporary. Security and compliance statements must be validated before going live.',
  };

  const sections = [
    {
      id: 'accueil',
      type: 'hero',
      title: 'Crypto,<br>in <i>CFA francs</i>',
      text: 'Buy, send and swap your crypto with Wave, Orange Money and the payment methods you already use.',
      stats: [
        { label: 'Payment methods', value: 8 },
        { label: 'Buy in', prefix: '< ', value: 2, suffix: ' min' },
        { label: 'Availability', value: 24, suffix: '/7' },
        { label: 'Native currency', text: 'XOF' },
      ],
      rates: { interval: 2200, count: 4 },
    },
    {
      id: 'cryptos',
      type: 'coins',
      title: 'Your <i>favourite</i><br>crypto, in one tap',
      cta: { label: 'Sign up', href: links.signup },
      speeds: [38, 46],
    },
    {
      id: 'application',
      type: 'app',
      title: 'All-in-one,<br>a <i>powerful</i> interface',
      text: 'A complete mobile app with every tool you need to manage your crypto anywhere, anytime.',
      perks: [
        { icon: 'plus', title: 'Transparent fees', text: 'The amount you receive is shown before you pay.' },
        { icon: 'bolt', title: 'Fast execution', text: 'Your purchases are credited within moments.' },
        { icon: 'card', title: 'Built-in Mobile Money', text: 'Wave, Orange Money, Mixx by Yas and more.' },
        { icon: 'shield', title: 'Secure wallet', text: 'Your assets protected, your access verified.' },
      ],
      video: { play: 'Play the animation', pause: 'Pause the animation', label: 'Zurumi app walkthrough: buying 20 USDT paid with Orange Money, from the home screen to a successful payment.', ...media.buyFlow },
    },
    {
      id: 'telecharger',
      type: 'sky',
      title: 'Buy &amp; send.<br>Wherever you <i>are.</i>',
      image: null,
    },
    {
      id: 'services',
      type: 'products',
      title: 'Everything you need<br>for <i>your crypto</i>',
      more: 'Learn more',
      items: [
        {
          title: 'Quick buy.',
          text: 'Buy crypto in CFA francs with Mobile Money, in seconds.',
          href: links.quickBuy,
          image: media.services.buy,
          ui: {
            title: 'Quick buy',
            meta: '1 USDT ≈ 607 XOF',
            rows: [
              { label: 'You pay', value: '50,000 XOF', coin: 'F' },
              { label: 'You receive', value: '82.40 USDT', coin: '₮' },
            ],
            cta: 'Pay with Wave',
          },
        },
        {
          title: 'Send & Receive.',
          text: 'Transfer to any wallet, receive by address or QR code.',
          href: links.send,
          image: media.services.transfer,
          ui: {
            title: 'Send · Receive',
            meta: 'Polygon network',
            rows: [
              { label: 'Recipient', value: '0x7a3F…c91E', mono: true, ok: '✓ verified' },
              { label: 'Amount', value: '25.00 USDT', coin: '₮' },
              { label: 'Network fee', value: '0.02 USDT', note: '≈ 1 min' },
            ],
            cta: 'Send',
          },
        },
        {
          title: 'Swap.',
          text: 'Convert one crypto into another at the displayed rate, with no surprises.',
          href: links.swap,
          image: media.services.swap,
          ui: {
            title: 'Swap',
            meta: 'Live rate',
            rows: [
              { label: 'From', value: '100 USDT', coin: '₮' },
              { divider: '⇅' },
              { label: 'To', value: '0.0412 ETH', coin: 'Ξ' },
            ],
            cta: 'Swap',
          },
        },
        {
          title: 'Withdraw.',
          text: 'Get your funds back in CFA francs, straight to your Mobile Money account.',
          href: links.withdraw,
          image: media.services.withdraw,
          ui: {
            title: 'Withdraw',
            meta: 'To Mobile Money',
            rows: [
              { label: 'You withdraw', value: '40,000 XOF', coin: 'F' },
              { option: 'Wave', selected: true },
              { option: 'Orange Money' },
            ],
            cta: 'Withdraw',
          },
        },
      ],
    },
    {
      id: 'mobile-money',
      type: 'mobileMoney',
      title: 'Pay with <b>Mobile Money,</b> <i>receive your crypto</i>',
      text: 'No bank card, no international transfer. The payment methods you use every day are enough.',
      perks: [
        { icon: 'pin', title: 'Local payment methods', text: 'Wave, Orange Money, Mixx by Yas and other operators in the region.' },
        { icon: 'pulse', title: 'Real-time tracking', text: 'Every operation is tracked, from payment to delivery.' },
        { icon: 'coin', title: 'Amounts in CFA francs', text: 'Prices, fees and balances shown in your currency.' },
      ],
      video: { label: 'Animation: stablecoins, fiat currencies and crypto assets flow into a deep liquidity pool, then out again at settlement.', play: 'Play the animation', pause: 'Pause the animation', ...media.liquidity.en },
    },
    {
      id: 'securite',
      type: 'security',
      title: 'Security<br><i>at the highest level</i>',
      items: [
        { icon: 'id', image: media.securityIcons.kyc, title: 'Identity verification', text: 'A KYC process to protect every account' },
        { icon: 'vault', image: media.securityIcons.custody, title: 'Specialised custody', text: 'Assets held by a dedicated custodian' },
        { icon: 'lock', image: media.securityIcons.zeroTrust, title: 'Zero Trust protection', text: 'Controlled access and monitored infrastructure' },
        { icon: 'scale', image: media.securityIcons.aml, title: 'AML / CFT', text: 'Controls aligned with FATF standards' },
      ],
      image: media.security,
    },
    {
      id: 'etapes',
      type: 'steps',
      title: 'Get started<br>in <i>a few minutes</i>',
      text: 'One account, one Mobile Money deposit, and you are ready.',
      cta: { label: 'Sign up', href: links.signup },
      interval: 3400,
      listLabel: 'Steps to get started',
      items: [
        { title: 'Create your account.', text: 'Sign up with your email or your mobile number.' },
        { title: 'Add funds.', text: 'Top up your account with Wave, Orange Money or crypto.' },
        { title: 'Buy and send.', text: 'Quick buy, send, swap and withdraw from a single wallet.' },
      ],
    },
    {
      id: 'portefeuille',
      type: 'globe',
      title: 'Your crypto, everywhere,<br><b>all the time</b>',
      text: 'A complete mobile app with every tool you need.',
      features: [
        { icon: 'chart', label: 'Real-time prices' },
        { icon: 'list', label: 'Detailed transaction history' },
        { icon: 'bell', label: 'Instant notifications' },
        { icon: 'fingerprint', label: 'Secure biometric login' },
      ],
      image: media.wallet,
    },
  ];

  const auth = {
    or: 'Or continue with',
    providers: [
      { id: 'google', label: 'Google' },
      { id: 'apple', label: 'Apple' },
    ],
    identifier: {
      label: 'Sign-in method',
      tabs: { email: 'Email', phone: 'Mobile number' },
      email: 'Email address',
      emailPlaceholder: 'name@example.com',
      phone: 'Mobile number',
      phonePlaceholder: '77 123 45 67',
      country: 'Country code',
      countrySearch: 'Search for a country',
      errors: {
        email: 'Enter a valid email address.',
        phone: 'Enter a valid mobile number (8 to 10 digits).',
      },
    },
    password: { label: 'Password', show: 'Show password', hide: 'Hide password' },
    demo: 'Demo: authentication is not connected to the server yet.',
  };

  const pages = {
    home: {
      meta: {
        title: 'Zurumi — Crypto, in CFA francs',
        description: 'Buy, send and swap your crypto with Wave, Orange Money and the payment methods you already use.',
      },
    },

    markets: {
      meta: {
        title: 'Markets — Zurumi',
        description: 'Crypto prices in CFA francs: trending, new listings and top performers.',
      },
      title: 'Markets <i>overview</i>',
      text: 'Follow prices in CFA francs and buy in one tap.',
      highlights: [
        { id: 'trending', title: 'Trending' },
        { id: 'newest', title: 'New listings' },
        { id: 'gainers', title: 'Top performers' },
      ],
      showInTable: 'Show in table',
      tabs: { label: 'Lists', favorites: 'Favourites', all: 'All' },
      search: { label: 'Search for a crypto', placeholder: 'Search' },
      chips: { label: 'Filter by category', all: 'All', new: 'New' },
      table: {
        title: 'All markets',
        text: 'Prices, changes and volumes, updated continuously.',
        caption: 'Cryptocurrency prices in XOF',
        cols: {
          rank: '#',
          name: 'Name',
          price: 'Price',
          change: 'Change',
          chart: '24h trend',
          cap: 'Market cap',
          volume: '24h volume',
          action: 'Action',
        },
        periods: [
          { id: '1h', label: '1h' },
          { id: '4h', label: '4h' },
          { id: '24h', label: '24h' },
        ],
        periodLabel: 'Change period',
        sort: 'Sort by {col}',
        favorite: { add: 'Add {name} to favourites', remove: 'Remove {name} from favourites' },
        buy: 'Buy',
        trade: 'Trade',
        empty: {
          favorites: 'No favourites yet. Tap the star next to a crypto to add it here.',
          search: 'No crypto matches “{query}”.',
        },
      },
      note: 'Demo: prices, market caps and volumes are fictitious and simulated in the browser.',
    },

    buy: {
      meta: {
        title: 'Quick buy — Zurumi',
        description: 'Buy and sell crypto in CFA francs with Wave, Orange Money or Mixx by Yas.',
      },
      title: 'Buy and sell<br>crypto <i>in seconds</i>',
      text: 'Pay in CFA francs with Wave, Orange Money or Mixx by Yas. The amount you receive is shown before you pay.',
      methodsLabel: 'Accepted payment methods',
      perks: [
        { icon: 'coin', text: 'Amounts shown in CFA francs' },
        { icon: 'bolt', text: 'Credited within moments' },
        { icon: 'shield', text: 'Secure wallet' },
      ],
      widget: {
        label: 'Quick buy',
        tabs: { buy: 'Buy', sell: 'Sell' },
        spend: 'I spend',
        receive: 'I receive',
        payWith: 'Pay with',
        receiveOn: 'Receive on',
        crypto: 'Crypto',
        cryptoSearch: 'Search for a crypto',
        method: 'Payment method',
        reference: 'Reference price',
        limits: 'Between {min} and {max}',
        cta: { buy: 'Buy {ticker}', sell: 'Sell {ticker}' },
        errors: {
          invalid: 'Enter a valid amount.',
          min: 'Minimum amount: {min}',
          max: 'Maximum amount: {max}',
        },
        note: 'The final amount is confirmed before payment.',
        demo: 'Demo: payment is not connected to the server yet.',
        empty: 'No results',
      },
      steps: {
        title: 'How it <i>works</i>',
        items: [
          { title: 'Choose an amount.', text: 'The crypto amount is calculated at the displayed rate.' },
          { title: 'Pay with Mobile Money.', text: 'Confirm the payment in Wave, Orange Money or Mixx by Yas.' },
          { title: 'Receive your crypto.', text: 'It is credited to your Zurumi wallet within moments.' },
        ],
      },
      faq: {
        title: 'Frequently asked <i>questions</i>',
        items: [
          {
            q: 'Which payment methods can I use?',
            a: 'Wave, Orange Money and Mixx by Yas. Amounts are shown and paid in CFA francs.',
          },
          {
            q: 'How long does it take to receive my crypto?',
            a: 'Once the payment is confirmed, your crypto is credited within moments.',
          },
          {
            q: 'How much will I receive?',
            a: 'The amount you receive is shown before you pay, and confirmed one last time before validation.',
          },
          {
            q: 'Do I need an account?',
            a: 'Yes. A verified account is required to buy, sell or withdraw. Signing up takes a few minutes.',
          },
        ],
      },
    },

    trade: {
      meta: {
        title: 'Trade — Zurumi',
        description: 'Chart, order book and spot orders on crypto pairs.',
      },
      pair: { label: 'Choose a pair', search: 'Search for a pair', empty: 'No pairs' },
      stats: {
        label: '24h statistics',
        change: '24h change',
        high: '24h high',
        low: '24h low',
        volume: '24h volume ({ticker})',
      },
      strip: 'Popular pairs',
      chart: {
        tabs: { chart: 'Chart', info: 'Info' },
        timeframes: [
          { id: '15m', label: '15m' },
          { id: '1h', label: '1h' },
          { id: '4h', label: '4h' },
          { id: '1d', label: '1D' },
          { id: '1w', label: '1W' },
        ],
        timeframeLabel: 'Timeframe',
        label: '{pair} candlestick chart, {tf} timeframe',
        ohlc: { o: 'O', h: 'H', l: 'L', c: 'C', v: 'Vol' },
        info: {
          name: 'Name',
          symbol: 'Symbol',
          category: 'Category',
          price: 'Price (XOF)',
          cap: 'Market cap (XOF)',
          volume: '24h volume (XOF)',
        },
      },
      book: {
        tabs: { book: 'Order book', trades: 'Recent trades' },
        price: 'Price ({ticker})',
        amount: 'Amount ({ticker})',
        total: 'Total ({ticker})',
        time: 'Time',
        views: { label: 'Display', both: 'Bids and asks', bids: 'Bids only', asks: 'Asks only' },
        grouping: 'Price grouping',
        pick: 'Use price {price}',
        ratio: { label: 'Buy / sell split', buy: 'B', sell: 'S' },
      },
      form: {
        label: 'Place an order',
        sides: { buy: 'Buy', sell: 'Sell' },
        types: { label: 'Order type', limit: 'Limit', market: 'Market' },
        price: 'Price',
        marketPrice: 'Best market price',
        amount: 'Amount',
        total: 'Total',
        percent: 'Share of available balance',
        available: 'Available',
        max: { buy: 'Max buy', sell: 'Max sell' },
        increase: 'Increase price',
        decrease: 'Decrease price',
        login: 'Log in',
        signup: 'Sign up',
        hint: 'Log in to place an order.',
        submit: { buy: 'Buy {ticker}', sell: 'Sell {ticker}' },
      },
      orders: {
        label: 'My orders',
        tabs: [
          { id: 'open', label: 'Open orders (0)' },
          { id: 'history', label: 'Order history' },
          { id: 'trades', label: 'Trade history' },
          { id: 'assets', label: 'Assets' },
        ],
        empty: '{login} or {signup} to see your orders.',
        login: 'Log in',
        signup: 'sign up',
      },
      accounts: { title: 'Accounts', trading: 'Trading account', deposit: 'Deposit', transfer: 'Transfer' },
      note: 'Demo: chart, order book and trades are simulated in the browser.',
    },

    login: {
      meta: {
        title: 'Log in — Zurumi',
        description: 'Log in to your Zurumi account with your email or mobile number.',
      },
      visual: {
        title: 'Your crypto,<br>with <i>confidence.</i>',
        text: 'Buy, send and withdraw in CFA francs from a single wallet.',
      },
      title: 'Log in',
      next: 'Next',
      submit: 'Log in',
      edit: 'Edit',
      forgot: 'Forgot your password?',
      noAccount: "Don't have an account?",
      signup: 'Sign up',
      errors: { password: 'Enter your password.' },
    },

    signup: {
      meta: {
        title: 'Sign up — Zurumi',
        description: 'Create your Zurumi account in a few minutes with your email or mobile number.',
      },
      visual: {
        title: 'Your account,<br>in <i>a few minutes.</i>',
        perks: [
          'Buy in CFA francs with Wave, Orange Money or Mixx by Yas',
          'The amount you receive is shown before you pay',
          'Send, swap and withdraw from a single wallet',
        ],
      },
      title: 'Create an account',
      step: 'Step {n}/{total}',
      progress: 'Sign-up progress',
      continue: 'Continue',
      back: 'Back',
      terms: 'I have read and accept the {terms} and the {privacy}.',
      termsLink: 'Terms of use',
      privacyLink: 'Privacy policy',
      verify: {
        title: 'Verify your {method}',
        methods: { email: 'email address', phone: 'number' },
        text: 'Enter the 6-digit code sent to {target}.',
        label: 'Verification code',
        digit: 'Digit {n} of 6',
        resend: 'Resend code',
        resendIn: 'Resend code in {s}s',
        resent: 'A new code has been sent.',
        submit: 'Verify',
      },
      password: {
        title: 'Choose a password',
        confirm: 'Confirm password',
        rulesLabel: 'Password rules',
        rules: { length: 'At least 8 characters', upper: 'One uppercase letter', lower: 'One lowercase letter', digit: 'One number' },
        submit: 'Create my account',
      },
      done: {
        title: 'Your account is ready',
        text: 'You can now make your first purchase in CFA francs.',
        cta: 'Make my first purchase',
      },
      errors: {
        terms: 'Accept the terms to continue.',
        code: 'Enter all 6 digits of the code.',
        password: 'The password does not meet all the rules.',
        confirm: 'The passwords do not match.',
      },
      hasAccount: 'Already have an account?',
      login: 'Log in',
    },
  };

  const more = morePages(links);
  const acc = accountContent(links);
  nav.account = acc.navAccount;
  return { locale: 'en', common, nav, footer, sections, auth, pages: { ...pages, ...more.pages, ...acc.pages, ...companyContent() }, legal: more.legal, notifications: acc.notifications, account: acc.account };
}
