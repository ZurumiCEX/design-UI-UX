# Zurumi Verify — logique

Repris de la livraison « Zurumi Verify » (machine à états, service, registre fictif, validation, Turnstile),
adapté au squelette :

- aucun texte ici : les libellés, messages, erreurs et étiquettes du registre sont dans `content/*-more.js` → `pages.verify` ;
- les validateurs et le service renvoient des **codes** (`email`, `rate_limited`…), traduits par l'interface ;
- le registre fictif renvoie une **clé** d'étiquette (`officialSite`…), traduite par l'interface — l'API réelle peut renvoyer un texte, affiché tel quel ;
- l'interface est reconstruite avec les composants et les tokens du site (pas de Tailwind).

Variables d'environnement (inchangées) : `VITE_VERIFY_USE_MOCK` (`true` par défaut) et `VITE_TURNSTILE_SITE_KEY` (clé publique).
Les fichiers Laravel d'origine sont dans `integration/verify/`.
