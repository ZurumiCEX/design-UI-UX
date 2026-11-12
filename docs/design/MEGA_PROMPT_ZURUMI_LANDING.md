# MÉGA PROMPT — Landing premium Zurumi (Blade + Vue 3)

> À coller dans Claude Code, à la racine du dépôt du site Zurumi.
> Avant de lancer, déposer ces fichiers dans le dépôt :
>
> - `docs/design/zurumi-landing-demo.html` — la démo de référence (source de vérité visuelle et animation)
> - `docs/design/zurumi-tokens.json` — les design tokens
> - `docs/design/zurumi-landing-1440.svg` — la maquette à calques (même contenu que Figma)
> - `docs/design/reference-frames/` — (optionnel) captures de la vidéo de référence

---

## 1. Rôle

Tu es à la fois lead designer produit, expert front-end (Blade, Vue 3, JavaScript, HTML/CSS) et architecte web. Tu livres un travail de niveau entreprise : fidèle à la référence, accessible, performant, maintenable par une petite équipe.

## 2. Mission

Reconstruire la page d'accueil de Zurumi à partir de `docs/design/zurumi-landing-demo.html`. Cette démo est la **source de vérité** : structure des sections, proportions, rythme vertical, états de survol et **toutes les animations** doivent être reproduits à l'identique. Tu ne redessines rien et tu ne « modernises » rien. Ton travail est de transformer cette démo monolithique en composants propres, intégrés à notre stack, sans régression visuelle.

En cas de doute entre ce prompt et la démo, **la démo gagne**. Ouvre-la dans un navigateur et compare section par section.

## 3. Avant d'écrire du code (obligatoire)

1. Inspecte le dépôt : version de Laravel, de Vue, présence de Vite, de Tailwind (et sa version), layout Blade principal, composants de navigation existants, gestion des traductions, routes nommées.
2. Lis la démo en entier (CSS, HTML, JS). Note chaque animation et son déclencheur.
3. Écris un plan dans `docs/design/PLAN.md` : arborescence cible, composants, ordre de livraison, risques. **Arrête-toi et présente ce plan avant d'implémenter.**

Règles d'intégration :

- Ne casse aucune route, aucun layout ni aucun composant existant. La nouvelle page vit derrière sa propre vue Blade (`resources/views/landing/index.blade.php`) et sa propre entrée Vite (`resources/js/landing/main.js`).
- Réutilise les routes nommées existantes pour tous les liens (inscription, connexion, achat rapide, envoyer, recevoir, échanger, retirer, portefeuille). Si une route manque, utilise `#` et liste-la dans le rapport final. N'invente pas d'URL.
- Si Tailwind est présent, branche les tokens dans sa configuration. Sinon, utilise `tokens.css` avec des variables CSS et du CSS par composant. N'installe pas Tailwind de ta propre initiative.

## 4. Identité visuelle (non négociable)

| Élément | Valeur |
|---|---|
| Couleur principale | `#5D3587` |
| Couleur secondaire | `#596FB7` |
| Teintes dérivées (texte d'accent, icônes, focus sur fond sombre) | `#B794E6`, `#9DB0F2` |
| Dégradé de marque | `linear-gradient(100deg, #5D3587, #596FB7)` |
| Dégradé clair (texte d'accent, lignes de progression) | `linear-gradient(100deg, #B794E6, #9DB0F2)` |
| Fond | `#050507`, surfaces `#0C0C12` / `#13131B` |
| Texte | blanc, atténué 60 %, discret 36 % |
| Hausse / baisse | `#3DDC97` / `#FF5C7A` |
| Police | **Inter** uniquement (400, 500, 600, 700), auto-hébergée en `woff2`, `font-display: swap` |
| Titres | graisse 600, interlettrage −0.045em, interligne 0.98 |
| Libellés (menu, boutons, tags) | 10.5 px, majuscules, interlettrage 0.14em, graisse 600 |
| Rayons | 6 / 10 / 18 px, pilule 999 px |
| Conteneur | 1240 px, gouttières 40 px (22 px en mobile), barre de navigation 56 px |

Toutes ces valeurs viennent de `docs/design/zurumi-tokens.json`. Génère `resources/css/tokens.css` à partir de ce fichier et n'écris **aucune couleur ni durée en dur** dans les composants.

Le violet `#5D3587` est trop sombre pour du texte sur fond noir : il sert aux fonds de boutons, dégradés et halos. Pour le texte et les icônes d'accent, utilise les teintes dérivées.

## 5. Menu (respecter le menu actuel de Zurumi)

- Achat rapide
- Transactions (menu déroulant)
  - Envoyer
  - Recevoir
  - Echanger
- Retirer
- Portefeuille

À droite : Rechercher, sélecteur de langue (FR), icône de téléchargement avec popover QR code + boutons stores, Connexion (bouton discret), S'inscrire (bouton principal).
En mobile (< 900 px) : logo, téléchargement, S'inscrire, burger ; le menu s'ouvre en panneau, le sous-menu Transactions est déplié.

## 6. Architecture cible

```
resources/
  css/
    tokens.css                  # variables CSS générées depuis zurumi-tokens.json
    landing.css                 # base, typographie, utilitaires de motion
  js/landing/
    main.js                     # monte l'app Vue sur #landing
    content/fr.js               # TOUT le contenu (textes, listes, étapes, liens)
    content/en.js, pt.js        # mêmes clés, à traduire plus tard
    composables/
      useReveal.js              # IntersectionObserver → classe .in (une seule instance partagée)
      useSplitText.js           # découpe mot à mot, conserve <i> (atténué) et <b> (accent)
      useScrollProgress.js      # expose --in et --p sur un élément, un seul listener rAF
      useCanvasLoop.js          # boucle rAF limitée en fps, en pause hors écran
      useReducedMotion.js
    components/
      ui/        ZButton.vue, ZTag.vue, ZCoinChip.vue, ZQrCode.vue, ZStoreButton.vue, ZIconTile.vue
      nav/       LandingNav.vue, NavDropdown.vue, DownloadPopover.vue
      sections/  HeroSection.vue, CoinsMarquee.vue, AppShowcase.vue, SkyBanner.vue,
                 ProductGrid.vue, MobileMoneySection.vue, SecuritySection.vue,
                 StepsSection.vue, GlobeSection.vue, LandingFooter.vue
      visuals/   MatrixBackground.vue, CandleChart.vue, RainCanvas.vue, DotGlobe.vue,
                 PhoneMock.vue, DashboardMock.vue, ShieldMark.vue, RidgeScene.vue, FloatingCoins.vue
  views/landing/index.blade.php # <head> SEO, polices, @vite, contenu critique rendu côté serveur
```

Principes :

- **Piloté par les données.** Aucun texte en dur dans les composants. Ajouter une section, une carte produit, une étape ou une langue ne doit demander qu'une modification de `content/*.js`.
- **Un composant = un fichier = une responsabilité.** Chaque section accepte ses données en props et ne connaît pas les autres.
- **Rendu progressif.** Le Blade rend le `<h1>`, le texte d'introduction et la navigation en HTML pur (SEO, pas d'écran vide). Vue hydrate et ajoute le mouvement. Sans JavaScript, la page reste lisible : aucun contenu ne doit rester à `opacity: 0`.
- **Script setup, Composition API.** Pas de dépendance d'animation par défaut : la démo fonctionne en CSS + JavaScript natif et tu dois garder cette approche. Si tu juges GSAP/ScrollTrigger ou Lenis nécessaires, justifie-le dans le plan et attends la validation.
- **Portabilité.** Les composants ne dépendent pas de Laravel : ils doivent pouvoir être repris tels quels dans un futur front Nuxt ou Next (les composables n'utilisent que les API du navigateur).

## 7. Sections (ordre et contenu)

Reprends les textes exacts de la démo ; ils sont dans le HTML. Résumé de la structure :

1. **Hero** — Titre sur deux lignes, dernier mot atténué. Texte d'introduction, champ « E-mail / Numéro mobile » + bouton, « ou via » Apple / Google. Quatre statistiques en bas à gauche. À droite, la fenêtre du tableau de bord (liste de paires + graphique en chandeliers) en perspective, qui déborde du bord droit. Fond : colonnes de chiffres très discrètes + halo violet.
2. **Cryptos** — Tag, titre centré, deux rangées de cartes de cryptos qui défilent en sens opposés avec fondu sur les bords, bouton.
3. **Application** — Tag, titre, texte. Un disque dégradé monte du bas et grandit ; le téléphone monte par-dessus ; quatre avantages apparaissent de part et d'autre.
4. **Bannière ciel** — Plein écran. Le fond passe du noir au bleu Zurumi pendant l'entrée, pluie fine, grand titre, crête de montagne avec ligne lumineuse violette et silhouette, QR code + boutons stores.
5. **Services** — Titre aligné à gauche. Grille 2 × 2 séparée par des filets : Achat rapide, Envoyer & Recevoir, Echanger, Retirer. Chaque cellule contient une mini-interface atténuée.
6. **Mobile Money** — Titre centré avec mot en dégradé, téléphone couché en 3D entouré de pièces flottantes, trois avantages, bouton.
7. **Sécurité** — Titre à gauche avec bouclier 3D ; à droite grille 2 × 2 de garanties, fond à fines hachures.
8. **Étapes** — Orbe lumineux au logo, deux rangées d'icônes qui défilent derrière ; titre + bouton à gauche, trois étapes numérotées à droite.
9. **Globe** — Grand titre, liste de quatre fonctions, boutons stores blancs ; à droite un globe en points qui tourne, avec points lumineux et cartes de cours.
10. **Pied de page** — Filet lumineux en haut, logo + phrase, quatre colonnes de liens, quatre boutons réseaux sociaux, copyright, retour en haut.

## 8. Spécification des animations (à reproduire à l'identique)

Courbe par défaut : `cubic-bezier(.2, .8, .2, 1)`. Toutes les valeurs sont dans les tokens.

| # | Élément | Déclencheur | Animation |
|---|---|---|---|
| A1 | Titres (`data-split`) | Entrée dans le viewport (seuil 18 %) | Mot par mot : `translateY(.55em) rotate(7deg)`, flou 12 px, opacité 0 → état final. 900 ms, décalage 75 ms par mot. Origine en bas à gauche. |
| A2 | Blocs (`data-reveal`) | Entrée dans le viewport | `translateY(18px)`, flou 6 px, opacité 0 → final. 800 ms, décalage 90 ms entre éléments frères. |
| A3 | Séquence d'ouverture | Chargement (polices prêtes) | Titre (A1) → petite barre de chargement → texte (700 ms) → formulaire (900 ms) → « ou via » (1100 ms) → statistiques (1700–2000 ms). Les éléments du menu apparaissent un à un de gauche à droite (70 ms d'écart, à partir de 500 ms). |
| A4 | Fenêtre du tableau de bord | Chargement, délai 1,5 s | Glisse depuis la droite : `translateX(46%) rotateY(-14deg) rotateX(4deg)` → `rotateY(-5deg) rotateX(2deg)`, 1,6 s. Parallaxe verticale légère au scroll (−60 px sur une hauteur d'écran). |
| A5 | Graphique | Après A4 | Les chandeliers et la moyenne mobile se dessinent de gauche à droite en 1,8 s, puis la dernière bougie bouge en continu. |
| A6 | Statistiques | 1,9 s après chargement | Compteur de 0 à la valeur, 1,4 s, décélération cubique. |
| A7 | Fond du hero | Continu | Colonnes de 0/1 qui tombent lentement, 14 images/s, très faible opacité, masque radial. |
| A8 | Barre de navigation | Scroll > 20 px | Flou progressif sous la barre (backdrop-filter 18 px avec masque en dégradé vers le bas). Le contenu passe dessous en se floutant. |
| A9 | Menu Transactions | Survol / focus | Panneau en verre dépoli : opacité + `translateY(-6px) scale(.98)` → final, 280 ms. Chevron qui pivote. Tuile d'icône qui passe au dégradé au survol de la ligne. |
| A10 | Popover de téléchargement | Survol / focus de l'icône | L'icône passe en blanc ; panneau en verre avec QR code, « ou via », boutons stores, 300 ms. |
| A11 | Cartes de cryptos | Continu | Deux rangées en défilement infini, sens opposés (38 s et 46 s), pause au survol, fondu sur 22 % de chaque bord. |
| A12 | Disque + téléphone | Lié au scroll (`--in`) | Disque : échelle 0.55 → 1 et remontée de 46 %. Téléphone : remontée de 62 %. Progression adoucie (décélération cubique). |
| A13 | Bannière ciel | Lié au scroll (`--in`) | Opacité du dégradé bleu 0 → 1 ; crête avant remonte de 18 %, crête arrière de 8 % (parallaxe). Pluie continue. |
| A14 | Cellules de services | Survol / focus | Mini-interface : opacité .34 → 1, saturation rétablie, échelle .97 → 1. Bouton « En savoir plus » qui glisse depuis la gauche. Filet du bas : 24 px blanc → toute la largeur en dégradé, 700 ms. |
| A15 | Pièces flottantes | Continu + scroll (`--p`) | Flottement vertical alterné (5 s, décalages différents) ; déplacement vertical supplémentaire selon le scroll, amplitude propre à chaque pièce ; le téléphone couché pivote de −8° à +8°. |
| A16 | Bouclier | Lié au scroll (`--p`) | Rotation 3D : `rotateX` 34° → 8°, `rotateZ` −14° → −4°. |
| A17 | Cellules de sécurité | Survol | Fond en léger dégradé, tuile d'icône qui passe au dégradé avec halo, repère vertical gauche qui s'allonge et se colore. |
| A18 | Orbe | Continu | Pulsation du halo (3,2 s) entre violet et bleu ; rangées d'icônes en défilement opposé, masquées sur les côtés. |
| A19 | Étapes | Automatique, 3,4 s | L'étape active passe à 100 % d'opacité, son numéro au dégradé ; l'indicateur vertical glisse d'un tiers (700 ms). Un clic sélectionne l'étape et relance le cycle. |
| A20 | Globe | Continu | Rotation lente, points plus lumineux vers l'avant, points d'activité pulsants. Les cartes de cours tournent toutes les 2,2 s (la première passe en dernier, opacité dégressive). |
| A21 | Boutons et liens | Survol | Bouton principal : remontée de 1 px + halo renforcé. Liens du pied de page : décalage de 3 px. Boutons réseaux : remontée de 2 px. |

Règles techniques du mouvement :

- N'anime que `transform`, `opacity` et `filter`. Aucune animation de `width`, `height`, `top`, `left` (exception : le filet A14).
- Un seul listener de scroll pour toute la page, limité par `requestAnimationFrame`, qui écrit des variables CSS (`--in`, `--p`). Le CSS fait le reste.
- Un seul `IntersectionObserver` partagé pour A1/A2 ; on arrête d'observer un élément une fois révélé.
- Chaque canvas est mis en pause quand il sort de l'écran, plafonné en images par seconde (14 à 40 selon le visuel) et en densité de pixels (2 maximum).
- `prefers-reduced-motion: reduce` : plus de découpe ni de flou, les éléments sont visibles immédiatement, les défilements et cycles automatiques s'arrêtent, les canvas affichent une image fixe.

## 9. Images et visuels

- Dans la démo, tous les visuels sont générés en code (SVG, CSS, canvas). Reprends-les comme composants `visuals/*` : ils sont légers, nets à toute résolution et déjà aux couleurs de Zurumi.
- Prévois pour chaque visuel majeur (téléphone, bannière ciel, bouclier, pièces) une prop `image` optionnelle. Quand elle est fournie, le composant affiche une image premium (AVIF + WebP, `srcset`, `loading="lazy"`, dimensions explicites) à la place du visuel en code. Les vraies captures de l'application et les rendus 3D seront fournis plus tard dans `public/images/landing/`.
- Logo : utilise le logo officiel présent dans le dépôt. Le « Z » de la démo n'est qu'un substitut.
- QR code : remplace le QR décoratif par un vrai QR pointant vers le lien de téléchargement (généré côté serveur ou via une petite bibliothèque), avec un texte alternatif.
- N'utilise aucun logo, image, texte ou nom de la vidéo de référence. Seuls la mise en page et les principes d'animation en sont repris.

## 10. Responsive, accessibilité, performance, SEO

- Points de rupture : 1100 px (masquer les avantages latéraux et les cartes de cours), 900 px (mise en page mobile, grilles sur une colonne, états de survol affichés en permanence). Vérifie 390, 768, 1024, 1440 et 1920 px. Aucun défilement horizontal.
- Accessibilité : contraste AA, navigation complète au clavier, `:focus-visible` apparent, menus accessibles (`aria-haspopup`, `aria-expanded`, fermeture par Échap), `aria-label` sur les titres découpés pour que les lecteurs d'écran lisent la phrase entière, éléments décoratifs en `aria-hidden`.
- Performance (mobile, Lighthouse) : Performance ≥ 90, Accessibilité ≥ 95, Bonnes pratiques ≥ 95, SEO ≥ 95. LCP < 2,5 s, CLS < 0,05. JavaScript de la page < 90 Ko compressé. Charge le globe et la pluie à la demande (import dynamique à l'approche du viewport).
- SEO : un seul `<h1>`, balises title/description, Open Graph, `lang="fr"`, données structurées `Organization`.

## 11. Évolutivité

- Thème : toutes les couleurs passent par les tokens, pour permettre un thème clair plus tard sans toucher aux composants.
- Langues : `content/fr.js` est la référence ; `en.js` et `pt.js` reprennent les mêmes clés. Prévois des textes 30 % plus longs sans casser la mise en page.
- Sections : la page est une liste ordonnée de sections dans `content/*.js` ; on doit pouvoir en retirer, en ajouter ou en réordonner sans modifier le code.
- Documentation : `docs/design/README.md` décrit les tokens, chaque composant (props, exemple) et la manière d'ajouter une section.

## 12. Contenu à ne pas inventer

- Les cours, montants, taux et statistiques de la démo sont **fictifs**. Garde-les dans `content/*.js` avec un commentaire `// DÉMO — à remplacer`, et prévois que les cours puissent venir d'une API plus tard.
- Les mentions de sécurité et de conformité sont des formulations provisoires : marque-les `// À VALIDER (conformité)` et n'ajoute aucune affirmation de licence, d'agrément ou de garantie.
- Ne cite que les moyens de paiement présents dans le contenu fourni.

## 13. Déroulement

Travaille par étapes, avec un commit par étape et une courte note de ce qui a été vérifié :

1. Plan (`docs/design/PLAN.md`) — **attendre la validation**.
2. Tokens, base CSS, polices, composables de mouvement.
3. Navigation + hero (A3 à A10).
4. Cryptos, application, bannière ciel (A11 à A13).
5. Services, Mobile Money, sécurité (A14 à A17).
6. Étapes, globe, pied de page (A18 à A21).
7. Responsive, accessibilité, mouvement réduit.
8. Performance, SEO, documentation, rapport final.

À chaque étape, ouvre la démo et la page côte à côte et compare : espacements, tailles, couleurs, durées, ordre d'apparition.

## 14. Critères d'acceptation

- [ ] Les dix sections sont présentes, dans l'ordre, visuellement conformes à la démo à 1440 px.
- [ ] Les animations A1 à A21 sont présentes, avec les mêmes déclencheurs, durées et courbes.
- [ ] Le menu correspond exactement à la section 5 et pointe vers les routes existantes.
- [ ] Seules les couleurs des tokens sont utilisées ; Inter est la seule police.
- [ ] Aucun texte en dur dans les composants ; tout est dans `content/fr.js`.
- [ ] Mobile, tablette et bureau sans défilement horizontal ; clavier et lecteur d'écran utilisables.
- [ ] Mouvement réduit respecté ; page lisible sans JavaScript.
- [ ] Seuils Lighthouse de la section 10 atteints (joins les scores au rapport).
- [ ] Aucune régression sur les pages existantes ; build Vite sans avertissement.
- [ ] Rapport final : ce qui a été fait, écarts éventuels avec la démo et pourquoi, routes manquantes, contenus à valider, visuels à fournir.
