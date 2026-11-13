# Zurumi Verify — `/verify`

Centre officiel de vérification d'identité et anti-phishing. Page publique autonome,
sans session, sans donnée persistée, en français par défaut.

---

## Arborescence

```
src/
  pages/VerifyPage.vue              Page /verify — assemble les sections
  components/verify/
    VerifyHero.vue                  Hero + badge + illustration animée
    VerificationForm.vue            Orchestration : formulaire → chargement → résultat
    VerificationTypeSelector.vue    Popover listbox ARIA (pas de <select> natif)
    VerificationInput.vue           Champ unique, placeholder piloté par le type
    VerificationLoading.vue         3 phases courtes + sceau en balayage
    VerificationResult.vue          Les 6 états de résultat
    VerificationSeal.vue            Élément signature (sceau animé)
    SecurityWarning.vue             « Zurumi ne vous demandera jamais… »
    TrustCategories.vue             4 cartes : sites, emails, réseaux, wallets
    AntiPhishingSection.vue         3 règles numérotées + CTA sécurité
    ReportCTA.vue                   Section signalement → /report
    VerifyFooter.vue                Pied de page sécurité
    VerifyIcon.vue                  Icônes SVG inline (24px, trait 1.6)
  composables/
    useVerification.js              Machine à états complète
    useTurnstile.js                 Turnstile invisible (clé publique uniquement)
  services/
    verifyService.js                Seule frontière UI ↔ API
    verifyApi.mock.js               Registre fictif pour la démo sans backend
  config/
    verificationTypes.js            Catalogue des 12 types vérifiables
    verifyStates.js                 États + presets de résultat (copie FR)
  utils/validators.js               Validation client + forme analytics anonymisée
  assets/verify.css                 Tokens, keyframes, prefers-reduced-motion
  router/verify.routes.js           Route /verify

public/verify/safe-internet.svg     Illustration animée du hero (SVG/SMIL, 247 Ko)

tailwind.verify.config.js           Bloc `extend` à fusionner (tout est préfixé `zv-`)
backend/                            Stubs Laravel 12 : route, FormRequest, contrôleur, Turnstile
demo/zurumi-verify-demo.html        Démo autonome, sans dépendance — à ouvrir dans un navigateur
```

## Intégration

1. Copier `src/` dans le projet Vue existant (adapter les chemins d'import si besoin).
2. Fusionner le bloc `theme.extend` de `tailwind.verify.config.js` dans `tailwind.config.js`.
3. Ajouter `verifyRoutes` au routeur.
4. Police : **Inter** uniquement, chargée par `@import` en tête de `src/assets/verify.css`.
   Si Inter est déjà servi par le build Zurumi, supprimez cet `@import`.
   Les identifiants (valeur vérifiée, exemples) utilisent la chasse fixe **système** —
   aucune seconde police web n'est téléchargée.
5. Copier `public/verify/safe-internet.svg` dans le dossier `public/` du projet.
   Le fichier est servi tel quel et référencé par `<img src="/verify/safe-internet.svg">` :
   les animations SMIL s'exécutent, aucun script du SVG n'est évalué.
6. Variables d'environnement :

```
VITE_VERIFY_USE_MOCK=true          # false une fois l'API branchée
VITE_TURNSTILE_SITE_KEY=           # clé PUBLIQUE ; vide = Turnstile désactivé
```

## Décisions de conception

**Le sceau.** Un seul objet porte trois rôles : il balaie pendant la vérification, il se
fige en marque au résultat, et sa couleur est la lecture la plus rapide du verdict.
C'est le seul endroit où la page se permet de l'animation.

**Palette.** Primaire `#5D3587`, secondaire `#596FB7`.

| Rôle | Couleur | Usage |
|---|---|---|
| Primaire | `#5D3587` | boutons, badge, état **Vérifié**, halo du sceau |
| Primaire clair | `#B08AD1` | texte et icônes sur fond noir (le primaire seul manque de contraste) |
| Secondaire | `#596FB7` | états **Non vérifié** / **Vérification impossible**, numérotation, halo de l'illustration |
| Ambre | `#E08A3C` | état **Suspect** |
| Rouge | `#E0484D` | état **Bloqué** |

**Vérifié = violet, jamais vert.** Le vert est la signature de KuCoin, le jaune celle de
Binance. Le succès est donc violet Zurumi, ce qui rend l'état positif inimitable.

**Le secondaire porte les états neutres.** « Non vérifié » et « Vérification impossible »
sont en bleu `#596FB7`, jamais en rouge : ils constatent une absence d'information, ils
n'accusent pas. Seuls `suspicious` et `blocked` déclenchent une alerte colorée.

**La valeur vérifiée est rendue en monospace.** L'utilisateur doit comparer une chaîne
caractère par caractère face à un écran de phishing : c'est la fonction du bloc « certificat ».

**Non vérifié ≠ frauduleux.** Les états `unverified` et `unknown` utilisent une teinte
acier neutre, jamais rouge, et une formulation qui n'accuse pas. Seuls `suspicious`
(ambre) et `blocked` (rouge) portent une alerte.

**Contre-exemples dans la section confiance.** Chaque carte montre l'identité officielle
et son imitation la plus courante : on reconnaît un motif plus vite qu'une règle.

## Sécurité

- Aucune donnée en `localStorage` / `sessionStorage`. Rien n'est persisté.
- Analytics : type + tranche de longueur uniquement (`utils/validators.js` → `toAnalyticsShape`).
  La requête complète n'est jamais envoyée.
- `risk_level` interne non exposé dans l'interface.
- Turnstile : seule la clé publique est côté front ; le secret reste dans Laravel.
- Rate limiting côté serveur (`throttle:verify`, Redis), 429 géré par le front.
- La validation client est un confort d'usage, pas un contrôle : le backend revalide tout.

## Accessibilité

- Lien d'évitement, HTML sémantique, `<form>` réel, labels explicites.
- Sélecteur de type conforme au motif ARIA listbox : ↑ ↓ Home End Entrée Échap.
- Chaque changement d'état est annoncé une fois via `role="status"` + `aria-live="polite"`.
- Focus visible et non supprimé (`.zv-focusable`).
- `prefers-reduced-motion` : les états restent, la chorégraphie disparaît.

## Démo

`demo/zurumi-verify-demo.html` s'ouvre directement dans un navigateur, sans build ni réseau.

Valeurs de test :

| Saisie | Type | Résultat |
|---|---|---|
| `support@zurumi.com` | Email | Vérifié |
| `zurumi.com` | Site web | Vérifié |
| `0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3` | Wallet | Vérifié |
| `@zurumi` | Instagram / TikTok | Vérifié |
| `facebook.com/zurumi` | Facebook | Vérifié |
| `zurumi-airdrop.com` | Site web | Suspect |
| `@zurumi_officiel` | TikTok | Suspect |
| `@zurumi.support` | Instagram | Bloqué |
| `zurumi-login.net` | Site web | Bloqué |
| `Aminata Diallo` | Représentant | Vérification impossible |
| toute autre valeur | — | Non vérifié |

## Illustration du hero

`safe_internet.svg` est placée sous le badge « Centre officiel de vérification », centrée,
largeur `min(360px, 78vw)`, avec un halo bleu secondaire qui l'ancre sur le fond sombre.

Deux réserves à arbitrer :

1. **Registre visuel.** L'illustration représente une scène familiale devant un ordinateur,
   dans une palette chaude (oranges, ocres). Elle évoque la sécurité numérique grand public
   plutôt que la vérification d'identité d'une plateforme d'échange régulée, et elle contredit
   la direction « cybersécurité premium » posée dans le cahier des charges.
2. **Poids et hauteur.** 247 Ko, et elle repousse le formulaire de vérification d'environ
   400 px vers le bas — l'objectif « l'action de vérification est évidente en 3 secondes »
   en pâtit sur mobile.

Si l'illustration est validée, une variante recolorée dans la palette Zurumi réglerait le
point 1 ; le point 2 se règle en la déplaçant sous le vérificateur plutôt qu'au-dessus.

## À faire avant production
- Alimenter `VerificationRegistry` côté Laravel avec le registre réel des identités.
- Créer la page `/report` (le CTA y renvoie déjà).
- Ajouter les métadonnées Open Graph et le `hreflang` si une version anglaise est prévue.
