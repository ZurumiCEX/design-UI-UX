# Landing Zurumi — guide du squelette Vue 3 + Vite

Squelette autonome de la page d'accueil, construit d'après la maquette `zurumi-landing-1440.svg`, les tokens `zurumi-tokens.json` et le cahier des charges `MEGA_PROMPT_ZURUMI_LANDING.md`. L'arborescence `resources/` reprend celle du cahier des charges pour être reportée telle quelle dans le dépôt Laravel.

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

## Arborescence

```
index.html                      # tient le rôle de views/landing/index.blade.php (head SEO + contenu critique)
scripts/build-tokens.mjs        # zurumi-tokens.json → tokens.css
resources/css/tokens.css        # GÉNÉRÉ — ne pas modifier
resources/css/landing.css       # base, typographie, utilitaires de mouvement, valeurs dérivées
resources/js/landing/
  main.js                       # monte l'app sur #landing, lit window.__LANDING__
  LandingPage.vue               # registre type de section → composant
  content/fr.js                 # TOUT le contenu ; en.js et pt.js reprennent les mêmes clés
  composables/                  # useReveal, useSplitText, useScrollProgress, useCanvasLoop, useReducedMotion, useNearViewport
  components/ui | nav | sections | visuals
```

## Tokens

`docs/design/zurumi-tokens.json` est la source de vérité. Chaque feuille devient une variable CSS nommée d'après son chemin :

| Token | Variable |
|---|---|
| `color.brand.primary` | `--color-brand-primary` |
| `gradient.brand-soft` | `--gradient-brand-soft` (angle lu dans `$description`) |
| `font.size.h2` | `--font-size-h2` et `--font-size-h2-fluid` (le `clamp()` de `$description`) |
| `motion.ease.out` | `--motion-ease-out` |
| `motion.duration.reveal` | `--motion-duration-reveal` |

Les composants n'écrivent ni couleur ni durée de transition en dur. Les mélanges (verre, halos, remplissages) et les délais de la séquence d'ouverture sont déclarés une seule fois en tête de `landing.css`, à partir des tokens. Les canvas lisent les tokens avec `token('--color-…')`.

Un thème clair se fait en redéfinissant les variables `--color-*` sous un sélecteur (`[data-theme="light"]`), sans toucher aux composants.

## Contenu et liens

`content/fr.js` exporte `createContent(linkOverrides)`. Le contenu contient `common` (marque, liens, cryptos, stores, téléchargement), `nav` et `sections`.

Les liens valent `#` par défaut. L'hôte injecte les vraies routes avant le script :

```html
<script>
  window.__LANDING__ = {
    locale: 'fr',
    links: { signup: '/inscription', login: '/connexion', quickBuy: '/achat-rapide' }
  };
</script>
```

Dans Blade, remplissez `links` avec `route('…')`. Clés disponibles : `home`, `signup`, `login`, `quickBuy`, `send`, `receive`, `swap`, `withdraw`, `wallet`, `search`, `appStore`, `googlePlay`, `download` (lien encodé dans le QR code).

Les titres acceptent trois balises : `<br>`, `<i>` (mot atténué) et `<b>` (mot en dégradé).

## Ajouter, retirer ou réordonner une section

La page est le tableau `sections` de `content/fr.js`. Retirer ou déplacer un objet suffit.

Pour un **nouveau type** de section :

1. Créez `components/sections/MaSection.vue` avec les props `data` (l'objet de la section) et `common`.
2. Enregistrez-le dans `registry` de `LandingPage.vue` : `maSection: MaSection`.
3. Ajoutez `{ id: 'mon-ancre', type: 'maSection', … }` dans `sections`.

Dans le gabarit, `v-split` anime un titre mot à mot (A1) et `v-reveal` un bloc (A2). `v-reveal="700"` impose un délai en millisecondes ; sans valeur, les éléments frères se décalent de 90 ms.

## Composables

| Composable | Rôle |
|---|---|
| `useReveal` | Un seul `IntersectionObserver` (seuil 18 %) ; ajoute `.in`, puis cesse d'observer. Fournit les directives `v-reveal` et `v-split`. |
| `useSplitText` | Découpe mot à mot, conserve `<i>`, `<b>`, `<br>`, pose `aria-label` avec la phrase entière. |
| `useScrollProgress(ref)` | Un seul listener de scroll limité par rAF ; écrit `--in` (entrée, 0 → 1) et `--p` (traversée, 0 → 1) sur l'élément, `--sy` sur `<html>`. |
| `useCanvasLoop(ref, { fps, setup, draw })` | Boucle plafonnée en images/seconde et en densité (2 max), en pause hors écran, image fixe en mouvement réduit. |
| `useReducedMotion` | Ref réactive sur `prefers-reduced-motion`. |
| `useNearViewport(ref)` | Vrai à l'approche du viewport ; déclenche les imports dynamiques (globe, pluie). |

## Composants

### `ui/`

| Composant | Props | Exemple |
|---|---|---|
| `ZButton` | `href`, `variant` (`primary` · `ghost` · `light` · `pill`), `size` (`md` · `lg`), `type` | `<ZButton href="#" size="lg">S'inscrire</ZButton>` |
| `ZTag` | — (slot) | `<ZTag>Nos services</ZTag>` |
| `ZCoinChip` | `coin` `{ glyph, name, ticker, price, change, up, tone }` | `<ZCoinChip :coin="coin" />` |
| `ZQrCode` | `value`, `label` (texte alternatif), `size` | `<ZQrCode :value="url" label="QR code…" />` |
| `ZStoreButton` | `store` `{ id, label, href }`, `variant` (`dark` · `light`) | `<ZStoreButton :store="store" variant="light" />` |
| `ZIconTile` | `icon`, `size`, `active` | `<ZIconTile icon="shield" :active="hovered" />` |
| `ZIcon` | `name`, `size` | `<ZIcon name="download" :size="16" />` |
| `ZLogo` | `brand`, `size`, `wordmark`, `image` | `<ZLogo brand="Zurumi" image="/images/logo.svg" />` |

### `nav/`

| Composant | Props |
|---|---|
| `LandingNav` | `data` (contenu `nav`), `common` |
| `NavDropdown` | `item` `{ label, children: [{ label, href, icon }] }` |
| `DownloadPopover` | `download` `{ label, or, qrAlt, url }`, `stores` |

### `sections/`

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
| `footer` | `LandingFooter` | A21 |

A8 à A10 sont dans `nav/`, A21 dans `ZButton`, `ZStoreButton` et le pied de page.

### `visuals/`

| Composant | Props | Note |
|---|---|---|
| `MatrixBackground` | — | canvas, 14 images/s |
| `CandleChart` | `candles`, `delay`, `duration`, `seed` | canvas, 30 images/s ; série de démo si `candles` est absent |
| `RainCanvas` | — | canvas, 40 images/s, import dynamique |
| `DotGlobe` | `hotspots`, `speed` | canvas, 30 images/s, import dynamique |
| `DashboardMock` | `data`, `coins`, `brand`, `chartDelay` | |
| `PhoneMock` | `screen`, `brand`, `variant` (`upright` · `lying`), `image` | |
| `ShieldMark` | `image` | |
| `RidgeScene` | `image` | |
| `FloatingCoins` | `coins`, `image` | |

La prop `image` remplace le visuel en code par une vraie image : `{ avif, webp, src, width, height, alt }`. Renseignez-la dans le champ `image` de la section, avec des fichiers déposés dans `public/images/landing/`.

## Report dans Laravel

1. Copiez `resources/css`, `resources/js/landing` et `scripts/build-tokens.mjs`.
2. Ajoutez `resources/js/landing/main.js` aux entrées de `laravel-vite-plugin` et installez `vue`, `@vitejs/plugin-vue`, `qrcode-generator`, `@fontsource-variable/inter`.
3. Créez `resources/views/landing/index.blade.php` à partir de `index.html` : même `<head>`, même bloc `#landing`, `@vite('resources/js/landing/main.js')`, et `window.__LANDING__` rempli avec les routes nommées.

## À faire avant mise en ligne

- **Démo HTML de référence** : absente du dépôt. Ce squelette suit la maquette statique et le tableau des animations ; comparez-le à la démo dès qu'elle est disponible, en particulier les courbes et les enchaînements.
- **Routes** : tous les liens valent `#`.
- **Lien de téléchargement** : `links.download` est un lien d'exemple ; le QR code l'encode.
- **Logo** : le « Z » est un substitut (`ZLogo`, prop `image`).
- **Contenus** : valeurs marquées `// DÉMO — à remplacer` et `// À VALIDER (conformité)` dans `content/fr.js`.
- **Traductions** : `en.js` et `pt.js` reprennent le français.
- **SEO** : `og:url`, `og:image`, lien canonique, `url` et `logo` de l'organisation.
- **Lighthouse** : non mesuré sur ce squelette.
