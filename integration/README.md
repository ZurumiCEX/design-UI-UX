# Intégration côté Laravel

Fichiers serveur fournis avec les livraisons « Zurumi Verify » et « Signalement », conservés tels quels pour l'équipe back-end.
Le front de ces deux pages a été reconstruit dans le squelette (`resources/js/landing/pages/VerifyPage.vue`, `ReportPage.vue`) :
les composants Vue et la démo HTML d'origine ne sont donc pas repris ici.

| Dossier | Contenu | À adapter |
|---|---|---|
| `verify/backend/` | Route API, FormRequest, contrôleur, service Turnstile | Le front appelle `POST /api/v1/verify` quand `VITE_VERIFY_USE_MOCK=false`. |
| `signalement/` | Contrôleur, FormRequest, vue Blade, guide d'intégration complet | Le front envoie le formulaire en `POST multipart` vers `window.__LANDING__.links.reportAction`, avec le jeton CSRF de `window.__LANDING__.csrf`. |

Différences avec les livraisons :

- **Route du signalement** : `/signaler-une-arnaque` (conservée). Le CTA de Verify y renvoie (il visait `/report`).
- **Vue Blade du signalement** : remplacée par le gabarit commun du site (`signaler-une-arnaque/index.html`). Reprendre de `signalement.blade.php` les balises `canonical` / Open Graph et les attributs `data-*`, à transmettre via `window.__LANDING__`.
- **Illustration du hero de Verify** (`safe-internet.svg`, 247 Ko) : non reprise. Le README de la livraison signalait qu'elle sort de la direction visuelle et repousse le formulaire d'environ 400 px ; le sceau animé la remplace.
- **Couleurs** : celles des tokens du site. L'ambre de l'état « Suspect » est devenu le token `color.state.warn` (#E08A3C).
- **Textes** : déplacés dans `content/fr-more.js` et `content/en-more.js` (versions française et anglaise).
