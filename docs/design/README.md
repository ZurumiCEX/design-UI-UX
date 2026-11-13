# Zurumi — guide du squelette Vue 3 + Vite

Squelette autonome du site Zurumi : la page d'accueil (d'après `zurumi-landing-1440.svg` et `MEGA_PROMPT_ZURUMI_LANDING.md`) et quatre pages applicatives — marchés, achat rapide, trade, connexion / inscription. L'arborescence `resources/` est prévue pour être reportée telle quelle dans le dépôt Laravel.

## Commandes

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run tokens` régénère `resources/css/tokens.css` ; `dev` et `build` le lancent d'eux-mêmes.

## Pages

| URL (squelette) | Fichier HTML | Entrée JS | Composant |
|---|---|---|---|
| `/` | `index.html` | `main.js` | `pages/HomePage.vue` |
| `/marches/` | `marches/index.html` | `entries/markets.js` | `pages/MarketsPage.vue` |
| `/achat-rapide/` | `achat-rapide/index.html` | `entries/buy.js` | `pages/BuyPage.vue` |
| `/trade/` | `trade/index.html` | `entries/trade.js` | `pages/TradePage.vue` |
| `/connexion/` | `connexion/index.html` | `entries/login.js` | `pages/LoginPage.vue` |
| `/inscription/` | `inscription/index.html` | `entries/signup.js` | `pages/SignupPage.vue` |
| `/convertir/` | `convertir/index.html` | `entries/convert.js` | `pages/ConvertPage.vue` |
| `/recevoir/` | `recevoir/index.html` | `entries/receive.js` | `pages/ReceivePage.vue` |
| `/envoyer/` | `envoyer/index.html` | `entries/send.js` | `pages/SendPage.vue` |
| `/p2p/` | `p2p/index.html` | `entries/p2p.js` | `pages/P2PPage.vue` |
| `/verify/` | `verify/index.html` | `entries/verify.js` | `pages/VerifyPage.vue` |
| `/signaler-une-arnaque/` | `signaler-une-arnaque/index.html` | `entries/report.js` | `pages/ReportPage.vue` |
| `/legal/conditions/` · `confidentialite/` · `risques/` · `conformite/` | `legal/*/index.html` | `entries/terms.js` … | `pages/LegalPage.vue` (prop `doc`) |
| `/portefeuille/` | `portefeuille/index.html` | `entries/wallet.js` | `pages/WalletPage.vue` |
| `/compte/` | `compte/index.html` | `entries/account.js` | `pages/AccountPage.vue` |
| `/compte/profil/` | `compte/profil/index.html` | `entries/profile.js` | `pages/ProfilePage.vue` |
| `/compte/securite/` | `compte/securite/index.html` | `entries/security.js` | `pages/SecurityPage.vue` |
| `/compte/verification/` | `compte/verification/index.html` | `entries/kyc.js` | `pages/KycPage.vue` |
| `/mot-de-passe-oublie/` | `mot-de-passe-oublie/index.html` | `entries/forgot.js` | `pages/ForgotPasswordPage.vue` |
| `/etat-des-services/` | `etat-des-services/index.html` | `entries/status.js` | `pages/StatusPage.vue` |
| `/a-propos/` | `a-propos/index.html` | `entries/about.js` | `pages/AboutPage.vue` |
| `/carrieres/` | `carrieres/index.html` | `entries/careers.js` | `pages/CareersPage.vue` |
| `/presse/` | `presse/index.html` | `entries/press.js` | `pages/PressPage.vue` |
| `/contact/` | `contact/index.html` | `entries/contact.js` | `pages/ContactPage.vue` |
| `/aide/` | `aide/index.html` | `entries/help.js` | `pages/HelpPage.vue` |

Chaque fichier HTML tient le rôle d'une vue Blade : `<head>` SEO, contenu critique rendu « côté serveur » (navigation, `<h1>`, introduction), puis l'entrée JS de la page. Les blocs communs sont des partiels : `<!-- @include head -->` et `<!-- @include fallback-nav -->` insèrent `resources/views/partials/*.html` (l'équivalent d'un `@include` Blade).

Chaque entrée appelle `boot(Page, { page })` (`boot.js`) : la langue est chargée, puis la page est montée sur `#landing`. Vite découpe le code par page : l'accueil ne charge pas le code du trade.

### Ce que fait chaque page

- **Marchés** — trois cartes (tendances, nouveautés, meilleures performances) dont le titre applique un tri ou un filtre au tableau ; onglets Favoris / Tous (favoris mémorisés dans le navigateur) ; recherche ; puces de catégories ; tableau triable (prix, variation 1 h / 4 h / 24 h, tendance 24 h, capitalisation, volume) avec liens Acheter / Trader ; cours qui bougent avec un éclair vert ou rouge.
- **Achat rapide** — onglets Acheter / Vendre ; montant en XOF ⇄ crypto au cours affiché ; choix de la crypto et du moyen de paiement (Wave, Orange Money, Mixx by Yas) ; limites et erreurs ; « Comment ça marche » ; FAQ. `?crypto=btc&mode=sell` présélectionne la crypto et le sens.
- **Trade** — sélecteur de paire avec recherche (`?pair=ETH-USDT`, mis à jour dans l'URL) ; dernier cours et statistiques 24 h ; bandeau défilant des paires ; graphique en chandeliers (5 unités de temps, moyennes mobiles 7 et 25, réticule et valeurs O/H/B/F au survol) ; onglet Infos ; carnet d'ordres (3 affichages, regroupement des prix, un clic renseigne le prix de l'ordre) et transactions récentes ; formulaire Achat / Vente, Limite / Marché ; mes ordres et comptes. Déconnecté, les boutons mènent à la connexion et à l'inscription.
- **Connexion** — identifiant par e-mail ou numéro mobile (indicatifs UEMOA), puis mot de passe ; Google / Apple.
- **Inscription** — 3 étapes : identifiant + conditions, code à 6 chiffres (collage et remplissage SMS acceptés, renvoi après 60 s), mot de passe avec règles en direct ; écran final. Le champ du hero de l'accueil pré-remplit l'identifiant (`?identifier=`).

- **Convertir** (menu Transactions → Echanger) — Payez / Obtenez avec sélecteurs de crypto, inversion, « Max », prix, frais (0,1 %, démo), tolérance de glissement (0,5 %, 1 %, personnalisée), minimum garanti, montant reçu ; bouton « Saisir le montant » / « Solde insuffisant » / « Convertir ».
- **Recevoir** — 3 étapes : crypto (liste + raccourcis), réseau, détails du dépôt (avertissement réseau, adresse à copier, QR code, mémo quand le réseau l'exige, minimum, confirmations, délai).
- **Envoyer** — 3 étapes : crypto ; destinataire (adresse validée selon le réseau, réseau déduit de l'adresse quand il est unique, carnet d'adresses, **transfert interne** vers un utilisateur Zurumi sans frais) ; montant (minimum, « Tout », solde, limite 24 h, objet, montant reçu, frais).
- **Tutoriel** — à côté de chacun de ces trois widgets, un tutoriel en 4 étapes suit la saisie (l'étape en cours s'allume), avec des conseils et un lien vers Zurumi Verify.
- **P2P** (menu Retirer) — **uniquement la vente d'USDT ou d'USDC contre des XOF**. Liste d'acheteurs (prix, ordres, taux de réussite, délai de paiement, quantité achetée, limites, moyens de paiement), filtres montant / moyen de paiement, tri. « Vendre » ouvre un panneau latéral : montant, XOF reçus, moyen de paiement, numéro Mobile Money, titulaire, confirmation, puis récapitulatif de l'ordre (démo). Tutoriel et règles de sécurité à côté.
- **Zurumi Verify** — reprise de la livraison : 12 types d'éléments groupés, chargement en 3 phases avec sceau animé, 6 résultats (vérifié, non vérifié, suspect, bloqué, impossible, erreur) en « certificat », cartes « à vérifier avant de faire confiance », règles anti-phishing, appel au signalement. Valeurs de test : voir `integration/verify/README-livraison.md`.
- **Signalement** — reprise de la livraison : nature, faits, preuves (glisser-déposer, 5 fichiers, 10 Mo), contact, champ piège, durée minimale de 6 s, addition, délai de 2 min entre deux envois ; confirmation avec numéro de dossier. `?type=p2p` présélectionne la nature.
- **Documents légaux** — modèles génériques (conditions, confidentialité, risques, conformité) avec sommaire qui suit la lecture ; éléments à compléter entre crochets.

- **Portefeuille** — solde total à masquer (œil, mémorisé) et à afficher en XOF ou en USD ; P&L du jour ; analyse du P&L sur 7, 30 ou 90 jours en trois vues (évolution de la valeur, P&L quotidien en barres de part et d'autre de zéro, calendrier mensuel) avec réticule et infobulle au survol et au clavier ; actifs (solde, valeur, prix, part, actions) avec « masquer les petits soldes » ; transactions filtrables par statut (réussie, en cours, annulée, échouée), par type et par recherche, détail dépliable.
- **Espace client** (menu latéral, onglets défilants sur mobile) — **tableau de bord** (UID copiable, niveau KYC, score de sécurité, premiers pas en 3 étapes, actifs, marché, notifications) ; **profil** (photo recadrée à 256 px, informations, coordonnées, préférences de langue et de devise, notifications par canal, fermeture du compte avec confirmation ; barre « modifications non enregistrées ») ; **sécurité** (score, méthodes de vérification, activation de Google Authenticator avec QR code, changement de mot de passe, code anti-phishing, appareils connectés, historique de connexion, gel du compte) ; **vérification d'identité** (niveaux et limites, parcours en 4 étapes vers le niveau 2 : adresse, justificatif, selfie, envoi).
- **Barre de navigation** — cloche de notifications (pastille du nombre de non-lues, onglets Toutes / Non lues, tout marquer comme lu) sur toutes les pages ; menu du compte (avatar) sur les pages de l'espace client et du portefeuille.
- **Mot de passe oublié** — identifiant, code à 6 chiffres, nouveau mot de passe, confirmation. Le message de l'étape 1 ne révèle pas si un compte existe. Lien depuis la connexion.
- **État des services** — bandeau global, maintenance planifiée, composants groupés avec 90 jours de disponibilité (30 sur mobile) et pourcentage, légende, historique des incidents avec chronologie, abonnement aux alertes.
- **Centre d’aide** — pensé pour les débutants : recherche instantanée (insensible aux accents, mots surlignés, Entrée ouvre le premier résultat), parcours « Premiers pas », thèmes, articles en étapes avec astuce/avertissement, bouton d’action, articles liés, « Cet article vous a-t-il aidé ? » et lexique. Navigation par ancre (`#/article/<id>`, `#/categorie/<id>`) : le bouton Précédent fonctionne et le focus passe au titre.
- **À propos / Carrières / Presse / Contact** — pages « Entreprise » du pied de page. Textes dans `content/fr-company.js` et `en-company.js` (mêmes clés).
- **Barre de navigation** — « Marché » au singulier, recherche retirée, Portefeuille sous forme de bouton `variant="secondary"` (nouvelle variante de `ZButton`) à droite ; masqué sous 600 px, où il reste dans le panneau mobile.
- **Hero** — le globe en points et les cartes de cours (`visuals/GlobeRates.vue`) remplacent la fenêtre de tableau de bord, qui passe dans la section « Portefeuille partout ». Le formulaire d'inscription et les boutons Apple / Google du hero sont retirés (l'inscription reste dans la barre).
- **Application** — vidéo du parcours d'achat (`visuals/AppVideo.vue`, fichiers dans `public/videos/`) à la place du téléphone dessiné et du disque bleu. WebM VP9 avec transparence (Chrome, Firefox, Edge) ; MP4 H.264 rendu sur `--color-bg-base` pour Safari et iOS, qui ignorent la transparence du WebM ; image d'attente WebP. Chargée à l'approche, lue seulement à l'écran, en pause par défaut si l'utilisateur réduit les animations, bouton lecture / pause. Les étiquettes « Paiement Mobile Money » et « Acheter · Envoyer · Echanger » sont retirées (`tag` est désormais facultatif).
- **Pied de page** — lien Marchés retiré (il reste dans le menu), icônes sociales HQ (`ui/ZSocialIcon.vue`, tracés Simple Icons CC0 : Facebook, X, Instagram, LinkedIn, Telegram, TikTok, YouTube, couleur de marque au survol), bouton « haut de page » `ui/BackToTop.vue` dont l’anneau se remplit avec la progression du défilement.

Les formulaires valident côté client. Tant que leur action serveur vaut `#`, ils affichent un message de démo au lieu d'envoyer.

## Arborescence

```
index.html, marches/, achat-rapide/, trade/, connexion/, inscription/   # une page = un HTML (≈ vue Blade)
scripts/build-tokens.mjs           # zurumi-tokens.json → tokens.css
resources/views/partials/          # head.html, fallback-nav.html
resources/css/tokens.css           # GÉNÉRÉ — ne pas modifier
resources/css/landing.css          # base, typographie, mouvement, champs, onglets, puces
resources/js/landing/
  boot.js                          # montage commun d'une page
  main.js, entries/*.js            # une entrée par page
  pages/                           # HomePage, MarketsPage, BuyPage, TradePage, LoginPage, SignupPage
  content/data.js                  # données sans texte : liens, cryptos, paires, moyens de paiement, pays, limites
  content/fr.js, en.js             # tout le texte (mêmes clés) ; pt.js à traduire
  composables/                     # useI18n, useMarketFeed, useSession, useReveal, useSplitText, useScrollProgress, useCanvasLoop…
  market/                          # demoFeed (cours), pairSimulator (graphique, carnet, transactions), links, random
  components/layout | nav | ui | sections | visuals | markets | buy | trade | auth
```

## Langues

Le français est la référence (`content/fr.js`), l'anglais est complet (`content/en.js`, mêmes clés). Le sélecteur de la barre (et du menu mobile) change la langue sans recharger la page : textes, titres découpés, formats de nombres et de dates, `<title>`, `description` et `<html lang>`.

Langue retenue, par ordre de priorité : `?lang=en`, choix mémorisé dans le navigateur, `window.__LANDING__.locale`, `<html lang>`, puis `fr`.

Pour ajouter une langue : créez `content/xx.js` avec les mêmes clés que `fr.js`, ajoutez son chargeur dans `content/index.js` et son entrée dans `languages` (`content/data.js`). `pt.js` existe mais n'est pas proposé tant qu'il n'est pas traduit.

Nombres et dates passent par `fmt` (`useI18n`) : `fmt.xof()`, `fmt.price()`, `fmt.pct()`, `fmt.compact()`, `fmt.date()`, et `fmt.parse()` pour lire une saisie (« 50 000,5 » ou « 50,000.5 »).

## Données de marché

Tous les cours sont **fictifs** et simulés dans le navigateur :

- `market/demoFeed.js` — un seul flux pour la page (`useMarketFeed`), mis à jour toutes les 2,6 s, en pause quand l'onglet est masqué. Utilisé par les marchés, l'achat rapide et le bandeau du trade.
- `market/pairSimulator.js` — une paire : chandeliers par unité de temps, carnet d'ordres et transactions, mis à jour chaque seconde.

Pour brancher une API ou un WebSocket, gardez la forme des objets (`price`, `change['1h'|'4h'|'24h']`, `cap`, `volume`, `spark`… ; `last`, `candles`, `book`, `trades`… pour une paire) et remplacez `step()`. Les composants n'ont pas à changer.

## Données des widgets

Dans `content/data.js` (toutes marquées DÉMO) : `networks` (réseaux par crypto, frais, minimum, confirmations, délai, mémo), `demoBalances` (soldes affichés sans utilisateur connecté), `swapFee`, `slippageOptions`, `sendLimitXof`, `p2pOffers` (acheteurs fictifs), `securityEmail`.

`useWallet()` renvoie les soldes de `window.__LANDING__.user.balances`, sinon les soldes de démo (les widgets l'indiquent).

`market/addresses.js` valide les adresses par famille de réseau (EVM, Tron, Bitcoin, Solana, XRP, TON, Dogecoin, Cardano). Les **adresses de dépôt de démo sont volontairement invalides** (elles contiennent « DEMO0 ») : aucun portefeuille ne les accepterait si la démo était publiée par erreur. À remplacer par l'adresse fournie par l'API.

## Graphiques

Les graphiques du portefeuille suivent le guide de visualisation : une seule série par graphique (pas de légende), traits de 2 px, barres arrondies côté donnée et ancrées sur zéro, 2 px d'écart, grille discrète, réticule et infobulle au survol **et au clavier** (flèches). Gains et pertes utilisent `state.up` / `state.down` **toujours accompagnés du signe + / −** (la couleur n'est jamais seule porteuse du sens). Le calendrier écrit la valeur de chaque jour ; la liste des transactions et le tableau des actifs donnent les mêmes informations sans graphique.

## Tokens

`docs/design/zurumi-tokens.json` est la source de vérité. Chaque feuille devient une variable CSS nommée d'après son chemin :

| Token | Variable |
|---|---|
| `color.brand.primary` | `--color-brand-primary` |
| `gradient.brand-soft` | `--gradient-brand-soft` (angle lu dans `$description`) |
| `font.size.h2` | `--font-size-h2` et `--font-size-h2-fluid` (le `clamp()` de `$description`) |
| `motion.ease.out` | `--motion-ease-out` |
| `motion.duration.reveal` | `--motion-duration-reveal` |

Les composants n'écrivent pas de couleur de thème en dur. Les mélanges (verre, halos, remplissages) et les délais de la séquence d'ouverture sont déclarés en tête de `landing.css` à partir des tokens. Les canvas lisent les tokens avec `token('--color-…')`. Exceptions, traitées comme des données : la couleur propre à chaque crypto et à chaque moyen de paiement (`tone` dans `data.js`).

## Contenu et liens

`content/fr.js` exporte `createContent(linkOverrides)` qui renvoie `common` (marque, liens, cryptos, paires, moyens de paiement, pays, langues), `nav`, `footer`, `sections` (accueil), `auth` (textes partagés connexion / inscription) et `pages` (titre, description et textes de chaque page).

Les liens par défaut sont dans `content/data.js` : les pages du squelette pointent vers leurs URL, le reste vaut `#`. L'hôte injecte les vraies routes avant le script :

```html
<script>
  window.__LANDING__ = {
    locale: 'fr',
    links: { signup: '/inscription', login: '/connexion', quickBuy: '/achat-rapide', loginAction: '/login' },
    user: null
  };
</script>
```

Clés : `home`, `quickBuy`, `markets`, `trade`, `login`, `signup`, `send`, `receive`, `swap`, `withdraw` (page P2P), `verify`, `report`, `terms`, `privacy`, `risks`, `compliance`, `wallet`, `deposit`, `search`, `forgotPassword`, `security`, `support`, `appStore`, `googlePlay`, `download` (encodé dans le QR code), et les actions de formulaires `loginAction`, `signupAction`, `buyAction`, `convertAction`, `sendAction`, `p2pAction`, `reportAction`. Le signalement lit aussi `window.__LANDING__.csrf`.

Les textes des nouvelles pages et des documents légaux sont dans `content/fr-more.js` et `content/en-more.js`, fusionnés dans `fr.js` / `en.js`.

`user` (non nul quand l'utilisateur est connecté) remplace, sur le trade, les boutons Connexion / Inscription par le bouton d'ordre et active le curseur de solde. Il alimente aussi le profil (`useProfile`) : sans hôte, un **utilisateur de démo** (`demoUser` dans `data.js`) est utilisé et ses modifications sont gardées dans le navigateur. Les pages de l'espace client et du portefeuille affichent la barre « connecté » (`<SiteLayout signed-in>`) ; c'est à l'hôte de les protéger par authentification.

Les titres acceptent `<br>`, `<i>` (mot atténué) et `<b>` (mot en dégradé). Dans les phrases contenant un lien, `{cle}` marque l'emplacement du lien (voir `terms` de l'inscription).

## Ajouter une section à l'accueil

La page d'accueil est le tableau `sections` de `content/fr.js` (et `en.js`). Retirer ou déplacer un objet suffit.

Pour un **nouveau type** de section :

1. Créez `components/sections/MaSection.vue` avec les props `data` (l'objet de la section) et `common`.
2. Enregistrez-le dans `registry` de `pages/HomePage.vue` : `maSection: MaSection`.
3. Ajoutez `{ id: 'mon-ancre', type: 'maSection', … }` dans `sections`, dans chaque langue.

Dans le gabarit, `v-split` anime un titre mot à mot (A1) et `v-reveal` un bloc (A2). `v-reveal="700"` impose un délai en millisecondes ; sans valeur, les éléments frères se décalent de 90 ms.

## Ajouter une page

1. Créez `pages/MaPage.vue` dans `<SiteLayout page="ma-page">` (ou `AuthShell` pour une page sans barre).
2. Créez `entries/ma-page.js` : `boot(MaPage, { page: 'maPage' })`.
3. Créez `ma-page/index.html` sur le modèle des autres et ajoutez-le aux `pages` de `vite.config.js`.
4. Ajoutez `pages.maPage` (avec `meta.title` et `meta.description`) dans chaque fichier de langue, et le lien dans `defaultLinks` et la navigation si besoin.

## Composables

| Composable | Rôle |
|---|---|
| `useI18n` | Langue courante, contenu, `setLocale()`, formats `fmt`, gabarits `t()` et `parts()`. |
| `useMarketFeed` | Flux de cours partagé (démo). |
| `useSession` | Utilisateur fourni par l'hôte (`window.__LANDING__.user`). |
| `useReveal` | Un seul `IntersectionObserver` (seuil 18 %) ; directives `v-reveal` et `v-split`. |
| `useSplitText` | Découpe mot à mot, conserve `<i>`, `<b>`, `<br>`, pose `aria-label` avec la phrase entière. |
| `useScrollProgress(ref)` | Un seul listener de scroll limité par rAF ; écrit `--in`, `--p` sur l'élément et `--sy` sur `<html>`. |
| `useCanvasLoop(ref, { fps, loop, setup, draw })` | Boucle plafonnée en images/seconde et en densité (2 max), en pause hors écran, image fixe en mouvement réduit. `loop: false` + `redraw()` pour dessiner à la demande. |
| `useReducedMotion` | Ref réactive sur `prefers-reduced-motion`. |
| `useNearViewport(ref)` | Vrai à l'approche du viewport ; déclenche les imports dynamiques (globe, pluie). |

## Composants

### `layout/` et `nav/`

| Composant | Props |
|---|---|
| `SiteLayout` | `page` (entrée de menu active), `footer` (défaut `true`), `solidNav` |
| `AuthShell` | — (slots `visual` et défaut) |
| `SvgDefs` | — (dégradés SVG partagés) |
| `LandingNav` | `data`, `common`, `page`, `solid` |
| `NavDropdown` | `item` `{ label, children: [{ label, href, icon }] }` |
| `LangSwitcher` | `align` (`right` · `left`) |
| `DownloadPopover` | `download`, `stores` |

### `ui/`

| Composant | Props | Exemple |
|---|---|---|
| `ZButton` | `href`, `variant` (`primary` · `ghost` · `light` · `pill`), `size` (`md` · `lg`), `type` | `<ZButton href="#" size="lg">S'inscrire</ZButton>` |
| `ZSelect` | `v-model`, `options` `[{ value, label, short?, sub?, glyph?, tone?, icon?, description?, group? }]`, `label`, `placeholder`, `searchable`, `searchLabel`, `empty`, `align`, `variant` (`chip` · `plain` · `field`) | `<ZSelect v-model="crypto" :options="opts" label="Crypto" searchable />` |
| `ZTag` | — (slot) | `<ZTag>Nos services</ZTag>` |
| `ZCoinIcon` | `glyph`, `tone`, `size` | `<ZCoinIcon glyph="₿" tone="#F7931A" />` |
| `ZCoinChip` | `coin` (objet de `data.js`) | `<ZCoinChip :coin="coin" />` |
| `ZQrCode` | `value`, `label`, `size` | `<ZQrCode :value="url" label="QR code…" />` |
| `ZStoreButton` | `store` `{ id, label, href }`, `variant` | `<ZStoreButton :store="store" variant="light" />` |
| `ZIconTile` | `icon`, `size`, `active` | `<ZIconTile icon="shield" :active="hovered" />` |
| `ZIcon` | `name`, `size` | `<ZIcon name="download" :size="16" />` |
| `ZLogo` | `brand`, `size`, `wordmark`, `image` | `<ZLogo brand="Zurumi" image="/images/logo.svg" />` |

### Pages applicatives

| Dossier | Composants |
|---|---|
| `markets/` | `MarketHighlights` (`coins`, `data`, `links`, émet `show`) |
| `buy/` | `BuyWidget` (`data`, `common`) |
| `trade/` | `PairHeader`, `TickerStrip`, `TradeChart` (`candles`, `version`, `formatPrice`, `formatTime`, `label`), `OrderBook` (émet `pick`, `group`), `OrderForm` (expose `setPrice`), `OrdersPanel` |
| `auth/` | `AuthVisual`, `IdentifierField` (`v-model:method/email/phone/country`), `PasswordField`, `OtpInput`, `AuthProviders`, `validate.js` |
| `tools/` | `ToolPage` (titre + widget + tutoriel), `TutorialSteps` (`data`, `active`), `StepBlock` (`n`, `title`, `done`, `last`), `ConvertWidget`, `ReceiveWidget`, `SendWidget` (émettent `step`) |
| `p2p/` | `SellSheet` (`offer`, `coin`, `data`, `common`, émet `close`) — panneau modal, focus piégé, Échap |
| `verify/` | `VerifyCard` (`data`, `links`), `VerifySeal` (`tone`, `icon`, `size`) ; logique dans `resources/js/landing/verify/` |
| `report/` | `ReportForm` (`data`, `endpoint`, `csrfToken`, `supportMail`) |

### `sections/` (accueil)

Toutes reçoivent `data` (leur entrée dans `sections`) et `common`.

| Type | Composant | Animations |
|---|---|---|
| `hero` | `HeroSection` | A1, A3 à A7 |
| `coins` | `CoinsMarquee` | A11 |
| `app` | `AppShowcase` | A12 |
| `sky` | `SkyBanner` | A13 |
| `products` | `ProductGrid` | A14 |
| `mobileMoney` | `MobileMoneySection` | A15 |
| `security` | `SecuritySection` | A16, A17 |
| `steps` | `StepsSection` | A18, A19 |
| `globe` | `GlobeSection` | A20 |

Le pied de page (`LandingFooter`, A21) est rendu par `SiteLayout` sur toutes les pages sauf le trade et l'authentification ; son contenu est `footer` dans les fichiers de langue.

### `visuals/`

| Composant | Props | Note |
|---|---|---|
| `MatrixBackground` | — | canvas, 14 images/s |
| `CandleChart` | `candles`, `delay`, `duration`, `seed` | canvas, 30 images/s (hero) |
| `RainCanvas` | — | canvas, 40 images/s, import dynamique |
| `DotGlobe` | `hotspots`, `speed` | canvas, 30 images/s, import dynamique |
| `StarField` | — | canvas, 24 images/s (authentification) |
| `Sparkline` | `values`, `up`, `width`, `height` | SVG |
| `DashboardMock` | `data`, `coins`, `brand`, `chartDelay` | dans la section « Portefeuille partout » |
| `GlobeRates` | `coins`, `rates` | globe + cartes de cours qui tournent ; dans le hero |
| `PhoneMock` | `screen`, `brand`, `variant`, `image` | section Mobile Money |
| `AppVideo` | `video` (`webm`, `mp4`, `poster`, `label`, `play`, `pause`) | section Application |
| `ShieldMark` | `image` | |
| `RidgeScene` | `image` | |
| `FloatingCoins` | `coins`, `image` | |

La prop `image` remplace le visuel en code par une vraie image : `{ avif, webp, src, width, height, alt }`, fichiers dans `public/images/landing/`.

## Report dans Laravel

1. Copiez `resources/css`, `resources/js/landing`, `scripts/build-tokens.mjs`.
2. Ajoutez `main.js` et `entries/*.js` aux entrées de `laravel-vite-plugin`, et installez `vue`, `@vitejs/plugin-vue`, `qrcode-generator`, `@fontsource-variable/inter`.
3. Pour chaque page, créez une vue Blade à partir de son fichier HTML : même `<head>`, partiels en `@include`, bloc `#landing`, `@vite('resources/js/landing/entries/….js')`, et `window.__LANDING__` rempli avec les routes nommées, la langue et l'utilisateur.
4. Les formulaires envoient en `POST` vers `loginAction`, `signupAction` et `buyAction` : ajoutez le jeton CSRF (`<input type="hidden" name="_token">`) et adaptez les noms de champs à vos contrôleurs.

## À faire avant mise en ligne

- **Démo HTML de référence** : absente du dépôt. L'accueil suit la maquette statique et le tableau des animations.
- **Routes** : `send`, `receive`, `swap`, `withdraw`, `wallet`, `deposit`, `search`, `forgotPassword`, `terms`, `privacy`, les stores et les fournisseurs Google / Apple valent `#`.
- **Back-end** : connexion, inscription (envoi et vérification du code), achat rapide, conversion, envoi, P2P, ordres et signalement ne sont pas branchés ; Verify tourne sur son registre fictif (`VITE_VERIFY_USE_MOCK`). Les stubs Laravel livrés sont dans `integration/`.
- **Adresses de dépôt** : fictives et volontairement invalides — à fournir par l'API.
- **Documents légaux** : modèles génériques à faire relire par un juriste ; compléter les crochets.
- **P2P** : le blocage des cryptos pendant l'ordre et les règles de litige sont à valider (`// À VALIDER`).
- **Espace client** : utilisateur, soldes, historique, transactions, notifications, appareils et connexions sont fictifs ; la clé 2FA de démo est factice. Limites KYC, score de sécurité, délai de 24 h après changement de mot de passe et délai d'examen KYC sont à valider.
- **État des services** : statuts, incidents et maintenance fictifs — à alimenter par l'outil de supervision.
- **À propos, Carrières, Presse, Contact, Centre d’aide** : chiffres, dates, noms (« Prénom Nom »), offres, communiqués, téléphone et adresse `[à compléter]` sont des exemples ; liens sociaux à `#` dans `content/data.js`.
- **Données** : cours, capitalisations, volumes, carnet, transactions et limites d'achat sont fictifs (`// DÉMO`).
- **Lien de téléchargement** : `download` est un lien d'exemple ; le QR code l'encode.
- **Logo** : le « Z » est un substitut (`ZLogo`, prop `image`).
- **Contenus** : valeurs `// À VALIDER (conformité)` dans les fichiers de langue (sécurité, FAQ).
- **Portugais** : `pt.js` reprend le français.
- **SEO** : `og:url`, `og:image`, lien canonique, `url` et `logo` de l'organisation.
- **Lighthouse** : non mesuré.
