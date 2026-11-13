# Page de signalement d'arnaques — Guide d'intégration

Documentation d'intégration de la page publique « Signaler une arnaque ou un abus » dans zurumi.com (Laravel + Blade + Vue 3).

**Version** 1.0 · **Route publique** `/signaler-une-arnaque` · **Contact** securite@zurumi.com

---

## 1. Contenu de la livraison

| Fichier livré | Destination dans le projet | Rôle |
|---|---|---|
| `SignalementForm.vue` | `resources/js/components/SignalementForm.vue` | Formulaire complet (UI, uploads, validation, animation de succès) |
| `signalement.blade.php` | `resources/views/pages/signalement.blade.php` | Page Blade, métadonnées SEO, point de montage |
| `SignalementController.php` | `app/Http/Controllers/SignalementController.php` | Réception, stockage, notifications |
| `StoreSignalementRequest.php` | `app/Http/Requests/StoreSignalementRequest.php` | Validation serveur (fait autorité) |
| `zurumi-signalement-apercu.html` | — (hors dépôt) | Aperçu statique pour validation visuelle |

Les fichiers restants (modèle, migration, mails, config) sont fournis en intégralité dans ce document, section par section.

### Prérequis

- Laravel 10 ou 11, PHP 8.1+
- Vue 3 et Vite déjà présents (`npm ls vue` → 3.x). Sinon, voir la section 9 : intégration **sans build**.
- Une file d'attente opérationnelle (`QUEUE_CONNECTION=database` ou `redis`) pour l'envoi des e-mails.

---

## 2. Charte appliquée

| Jeton | Valeur | Usage |
|---|---|---|
| `--z-primary` | `#5D3587` | Cartes sélectionnées, bouton d'envoi, cases à cocher |
| `--z-secondary` | `#596FB7` | Focus, liens d'accent, icônes, dégradé du bouton |
| Fond | `#08070B` | Fond de page |
| Surface | `#0E0C14` / `#15121D` | Panneaux et modale |
| Texte | `#F4F3F7` / `#9A94A8` | Principal / secondaire |
| Succès | `#5BD6A4` | Sceau de confirmation |
| Erreur | `#FF7A6B` | Messages de validation |
| Police | **Inter** 400/500/600/700 | Toute la page |

Le composant lit `--z-primary` et `--z-secondary` depuis son conteneur : si le layout global du site définit déjà ces variables, elles prennent le dessus sans modifier le composant.

### Correctif du menu déroulant

La liste native du `<select>` héritait du thème clair du système : texte clair sur fond clair, illisible. Trois déclarations corrigent le rendu sur Chrome/Edge Windows, Firefox et Safari :

```css
select { color-scheme: dark; }
select option { background-color: #15121D; color: #F4F3F7; }
select option:checked { background-color: #5D3587; color: #fff; }
```

`color-scheme: dark` suffit sur macOS ; les deux règles `option` sont indispensables sur Windows, où le popup est dessiné par le système. Si d'autres `<select>` du site présentent le même défaut, ces règles peuvent remonter dans la feuille globale.

---

## 3. Installation pas à pas

### 3.1 Composant et point d'entrée

Copier `SignalementForm.vue` dans `resources/js/components/`, puis créer le point d'entrée :

```js
// resources/js/signalement.js
import { createApp, h } from 'vue'
import SignalementForm from './components/SignalementForm.vue'

const el = document.getElementById('signalement-app')

if (el) {
  createApp({
    render: () => h(SignalementForm, {
      endpoint:    el.dataset.endpoint,
      csrfToken:   el.dataset.csrf,
      supportMail: el.dataset.supportMail,
    }),
  }).mount(el)
}
```

Déclarer l'entrée dans `vite.config.js` :

```js
laravel({
  input: [
    'resources/css/app.css',
    'resources/js/app.js',
    'resources/js/signalement.js', // ← ajouter
  ],
  refresh: true,
}),
```

Vérifier que le plugin Vue est actif dans `vite.config.js` :

```js
import vue from '@vitejs/plugin-vue'
// plugins: [laravel({...}), vue()]
```

S'il est absent : `npm i -D @vitejs/plugin-vue`.

### 3.2 Vue Blade

Copier `signalement.blade.php` dans `resources/views/pages/`. La vue suppose que le layout expose les stacks `head` et `scripts` :

```blade
{{-- resources/views/layouts/app.blade.php --}}
<head>
    ...
    @stack('head')
</head>
<body>
    ...
    @stack('scripts')
</body>
```

Si le layout utilise d'autres noms (`@yield('styles')`, etc.), adapter les deux `@push` de la vue.

### 3.3 Routes

```php
// routes/web.php
use App\Http\Controllers\SignalementController;

Route::get('/signaler-une-arnaque', [SignalementController::class, 'create'])
    ->name('signalements.create');

Route::post('/signalements', [SignalementController::class, 'store'])
    ->middleware('throttle:signalements')
    ->name('signalements.store');
```

La route POST reste dans `web.php` (et non `api.php`) pour bénéficier de la session et du jeton CSRF.

Déclarer le limiteur dans `app/Providers/RouteServiceProvider.php`, méthode `boot()` :

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('signalements', function (Request $request) {
    return [
        Limit::perMinutes(10, 3)->by($request->ip()),   // 3 envois / 10 min par IP
        Limit::perDay(20)->by($request->ip()),          // plafond quotidien
    ];
});
```

Sur Laravel 11, le même code va dans `bootstrap/app.php` ou dans un `AppServiceProvider::boot()`.

### 3.4 Base de données

```bash
php artisan make:migration create_signalements_table
```

```php
// database/migrations/xxxx_create_signalements_table.php
public function up(): void
{
    Schema::create('signalements', function (Blueprint $table) {
        $table->id();
        $table->string('reference', 20)->unique();
        $table->string('type', 30)->index();
        $table->text('description');
        $table->string('canal', 60)->nullable();
        $table->date('date_faits')->nullable();
        $table->string('lien', 500)->nullable();
        $table->decimal('montant', 18, 2)->nullable();
        $table->string('devise', 10)->nullable();
        $table->string('nom', 120)->nullable();
        $table->string('telephone', 30)->nullable();
        $table->string('email', 190)->index();
        $table->string('statut', 20)->default('nouveau')->index();
        $table->text('notes_internes')->nullable();
        $table->string('ip_hash', 64)->nullable()->index(); // haché, jamais l'IP en clair
        $table->string('user_agent', 255)->nullable();
        $table->timestamps();
    });

    Schema::create('signalement_preuves', function (Blueprint $table) {
        $table->id();
        $table->foreignId('signalement_id')->constrained()->cascadeOnDelete();
        $table->string('chemin');
        $table->string('nom_original', 180);
        $table->string('mime', 60);
        $table->unsignedBigInteger('taille');
        $table->timestamps();
    });
}
```

```php
// app/Models/Signalement.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Signalement extends Model
{
    use HasFactory;

    public const STATUT_NOUVEAU  = 'nouveau';
    public const STATUT_EN_COURS = 'en_cours';
    public const STATUT_TRAITE   = 'traite';
    public const STATUT_REJETE   = 'rejete';

    protected $fillable = [
        'reference', 'type', 'description', 'canal', 'date_faits', 'lien',
        'montant', 'devise', 'nom', 'telephone', 'email', 'statut',
        'ip_hash', 'user_agent',
    ];

    protected $casts = [
        'date_faits' => 'date',
        'montant'    => 'decimal:2',
    ];

    public function preuves(): HasMany
    {
        return $this->hasMany(SignalementPreuve::class);
    }

    public function libelleType(): string
    {
        return [
            'faux-site'      => 'Faux site ou fausse app',
            'usurpation'     => "Usurpation d'identité",
            'investissement' => "Arnaque à l'investissement",
            'compte'         => 'Compte piraté',
            'p2p'            => 'Litige P2P',
            'autre'          => 'Autre abus',
        ][$this->type] ?? $this->type;
    }
}
```

```php
// app/Models/SignalementPreuve.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SignalementPreuve extends Model
{
    protected $table = 'signalement_preuves';

    protected $fillable = ['chemin', 'nom_original', 'mime', 'taille'];
}
```

### 3.5 Stockage privé des preuves

Les pièces jointes contiennent des captures de conversations et parfois des documents d'identité. Elles ne doivent **jamais** être servies depuis `public/`.

```php
// config/filesystems.php
'preuves' => [
    'driver'     => 'local',
    'root'       => storage_path('app/private/preuves'),
    'visibility' => 'private',
    'throw'      => false,
],
```

Consultation par un membre de l'équipe conformité authentifié :

```php
// routes/web.php
Route::get('/admin/signalements/preuve/{preuve}', function (App\Models\SignalementPreuve $preuve) {
    return Storage::disk('preuves')->download($preuve->chemin, $preuve->nom_original);
})->middleware(['auth', 'can:consulter-signalements'])->name('signalements.preuve');
```

### 3.6 Notifications

```bash
php artisan make:mail SignalementInterne
php artisan make:mail SignalementAccuseReception
```

```php
// app/Mail/SignalementInterne.php
public function __construct(public Signalement $signalement) {}

public function envelope(): Envelope
{
    return new Envelope(
        subject: "[{$this->signalement->reference}] {$this->signalement->libelleType()}",
        replyTo: $this->signalement->email ? [$this->signalement->email] : [],
    );
}

public function content(): Content
{
    return new Content(markdown: 'emails.signalement-interne');
}
```

```blade
{{-- resources/views/emails/signalement-interne.blade.php --}}
@component('mail::message')
# Nouveau signalement — {{ $signalement->reference }}

**Nature** : {{ $signalement->libelleType() }}
**Canal** : {{ $signalement->canal ?: 'non précisé' }}
**Date des faits** : {{ optional($signalement->date_faits)->format('d/m/Y') ?: 'non précisée' }}
**Montant** : {{ $signalement->montant ? $signalement->montant . ' ' . $signalement->devise : 'non précisé' }}
**Élément identifiant** : {{ $signalement->lien ?: '—' }}
**Contact** : {{ $signalement->nom ?: 'anonyme' }} — {{ $signalement->email }} {{ $signalement->telephone }}
**Pièces jointes** : {{ $signalement->preuves->count() }}

---

{{ $signalement->description }}

@component('mail::button', ['url' => url('/admin/signalements/' . $signalement->id)])
Ouvrir le dossier
@endcomponent
@endcomponent
```

L'accusé de réception destiné au déclarant reprend la référence, le délai de 48 h et les consignes de sécurité immédiates. Il ne reprend **pas** la description saisie : la boîte du déclarant peut être compromise, c'est fréquent dans les dossiers « compte piraté ».

Configuration de l'adresse de destination :

```php
// config/mail.php
'security_address' => env('MAIL_SECURITY_ADDRESS', 'securite@zurumi.com'),
```

```dotenv
# .env
MAIL_SECURITY_ADDRESS=securite@zurumi.com
QUEUE_CONNECTION=database
```

### 3.7 Journal de sécurité

```php
// config/logging.php
'security' => [
    'driver' => 'daily',
    'path'   => storage_path('logs/security.log'),
    'level'  => 'info',
    'days'   => 90,
],
```

### 3.8 Compilation

```bash
php artisan migrate
npm run build          # ou npm run dev en local
php artisan queue:work # traitement des e-mails
```

---

## 4. Limites de taille : les trois plafonds à aligner

Un upload de 10 Mo échoue silencieusement si l'un des trois niveaux est trop bas.

```ini
; php.ini
upload_max_filesize = 12M   ; > 10 Mo, marge pour l'encodage multipart
post_max_size       = 40M   ; > 5 fichiers × 10 Mo + champs
max_file_uploads    = 10
max_execution_time  = 120
memory_limit        = 256M
```

```nginx
# nginx : bloc server ou location
client_max_body_size 40M;
```

Après modification : `sudo systemctl reload php8.2-fpm && sudo systemctl reload nginx`.

Sur o2switch, `upload_max_filesize` et `post_max_size` se règlent depuis cPanel → **Sélectionner une version de PHP** → **Options**, ou via un `.user.ini` à la racine du site.

---

## 5. Dispositif anti-spam

Cinq barrières, dont trois côté serveur. Les barrières client font baisser le bruit ; seules celles du serveur protègent réellement.

| # | Barrière | Où | Comportement |
|---|---|---|---|
| 1 | Champ piège `site_entreprise` | Client + **serveur** | Invisible aux humains. Rempli → réponse 201 avec une fausse référence, rien n'est enregistré |
| 2 | Durée de remplissage < 5 s | Client + **serveur** | Même traitement silencieux |
| 3 | Question arithmétique | Client | Régénérée à chaque échec |
| 4 | Limite de débit | **Serveur** | 3 envois / 10 min et 20 / jour par IP → 429 |
| 5 | Description ≥ 40 caractères | Client + **serveur** | Élimine les envois vides |

Le rejet silencieux est délibéré : renvoyer « honeypot détecté » apprend à l'automate ce qu'il doit contourner.

### Option : Cloudflare Turnstile

Si le volume de spam le justifie après mise en production, ajouter Turnstile plutôt que de durcir la question arithmétique — invisible pour l'utilisateur, sans coût d'usage.

```blade
{{-- dans la vue Blade --}}
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

```html
<!-- dans le template du composant, avant le bouton -->
<div class="cf-turnstile" data-sitekey="{{ config('services.turnstile.key') }}"></div>
```

```php
// dans le contrôleur, avant l'enregistrement
$verif = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
    'secret'   => config('services.turnstile.secret'),
    'response' => $request->input('cf-turnstile-response'),
    'remoteip' => $request->ip(),
]);

if (! $verif->json('success')) {
    return response()->json(['reference' => $this->reference()], 201);
}
```

---

## 6. Sécurité des fichiers reçus

1. **Validation par contenu réel** : `mimetypes:` inspecte le fichier, `mimes:` l'extension. Les deux sont appliqués — un `.pdf` renommé depuis un `.php` est rejeté.
2. **Nom généré par Laravel** : `store()` produit un nom aléatoire, le nom d'origine n'est conservé qu'en base. Un fichier nommé `../../.env` ne peut rien écraser.
3. **Hors racine web** : `storage/app/private/preuves`, inaccessible par URL.
4. **Analyse antivirus** (recommandé, ClamAV) :

```php
$resultat = Process::run("clamscan --no-summary {$fichier->getRealPath()}");
if ($resultat->exitCode() === 1) {
    // fichier infecté : ne pas stocker, journaliser
}
```

5. **IP jamais en clair** : seule une empreinte SHA-256 salée par `APP_KEY` est conservée, suffisante pour repérer un déclarant récidiviste sans stocker de donnée personnelle directe.

---

## 7. Conformité et conservation

- **Base légale** : intérêt légitime (lutte contre la fraude) et obligations LBC/FT du statut PSAN/VASP.
- **Mention obligatoire** : la case de consentement renvoie à la politique de confidentialité. Y ajouter un paragraphe décrivant ce traitement (finalité, destinataires, durée).
- **Durée de conservation suggérée** : 5 ans pour les dossiers liés à la LBC/FT, 12 mois pour les signalements classés sans suite. Purge automatisée :

```php
// app/Console/Kernel.php  (ou routes/console.php sur Laravel 11)
$schedule->call(function () {
    Signalement::where('statut', Signalement::STATUT_REJETE)
        ->where('updated_at', '<', now()->subYear())
        ->each(function ($s) {
            $s->preuves->each(fn ($p) => Storage::disk('preuves')->delete($p->chemin));
            $s->delete();
        });
})->weekly();
```

- **Droit d'accès** : la référence `ZRM-SIG-XXXXXX` sert d'identifiant de dossier lors d'une demande d'accès ou d'effacement.

---

## 8. Accessibilité et compatibilité

- Navigation clavier complète, y compris la zone de dépôt (`Entrée` / `Espace`).
- Focus visible sur tous les contrôles, contraste ≥ 4,5:1 sur le texte principal.
- `prefers-reduced-motion` respecté : animations neutralisées, le sceau s'affiche à l'état final.
- La modale de confirmation est un `role="dialog" aria-modal="true"`, fermable par `Échap`.
- Sans JavaScript, le `<noscript>` renvoie vers l'adresse e-mail de sécurité.
- Testé sur Chrome, Firefox, Safari, Edge et Safari iOS. Le glisser-déposer n'existe pas sur mobile : le clic ouvre le sélecteur natif, comportement attendu.

---

## 9. Variante sans build (Vue via CDN)

Si le site sert du Blade et du HTML sans pipeline Vite, monter le composant en global build de Vue :

```blade
@push('scripts')
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script type="module">
  const { createApp, ref, reactive, computed, onMounted } = Vue;
  // Recopier le contenu de <script setup> dans un objet { setup() {...} },
  // le <template> dans la propriété template, et déplacer les <style>
  // du composant dans une feuille CSS chargée par la page.
  createApp({ /* ... */ }).mount('#signalement-app');
</script>
@endpush
```

Plus simple dans ce cas : servir `zurumi-signalement-apercu.html` comme gabarit et transformer sa balise `<form>` en `POST` Blade classique (`@csrf`, `enctype="multipart/form-data"`), avec redirection vers une page de confirmation portant l'animation. Vous perdez la validation instantanée et les vignettes ; le reste du dispositif est identique. Je peux fournir cette variante si vous préférez éviter Vue sur cette page.

---

## 10. Recette avant mise en production

- [ ] `/signaler-une-arnaque` s'affiche avec la police Inter et les couleurs #5D3587 / #596FB7
- [ ] Les menus déroulants sont lisibles sur Windows, macOS et Android
- [ ] Envoi avec 5 fichiers (2 images + 3 PDF) : succès, fichiers présents dans `storage/app/private/preuves`
- [ ] Fichier de 11 Mo : rejeté côté client, et côté serveur si l'appel est forgé
- [ ] Fichier `.exe` renommé `.pdf` : rejeté par `mimetypes`
- [ ] Quatrième envoi en 10 minutes : réponse 429
- [ ] Champ piège rempli via devtools : réponse 201, aucune ligne créée en base
- [ ] E-mail interne reçu sur securite@zurumi.com, accusé de réception reçu par le déclarant
- [ ] Numéro de dossier affiché et unique
- [ ] Navigation clavier de bout en bout
- [ ] Lighthouse : accessibilité ≥ 95
- [ ] Page ajoutée au pied de page du site et au `sitemap.xml`
- [ ] Politique de confidentialité mise à jour

---

## 11. Incidents courants

| Symptôme | Cause | Correction |
|---|---|---|
| Texte du `<select>` invisible | Thème clair hérité du système | Voir section 2 |
| 419 Page Expired | Jeton CSRF absent ou session expirée | Vérifier `data-csrf` dans la vue Blade et le domaine de session |
| 413 Request Entity Too Large | `client_max_body_size` trop bas | Section 4 |
| Upload silencieusement vide | `post_max_size` dépassé — PHP vide `$_POST` | Section 4 |
| Composant non monté | Entrée absente de `vite.config.js` ou `id` du div modifié | Sections 3.1 et 3.2 |
| Aucun e-mail reçu | File d'attente non traitée | `php artisan queue:work`, superviser avec Supervisor |
| 422 sur `preuves.0` | Type de fichier refusé par `mimetypes` | Vérifier le fichier ; élargir la liste si un format légitime manque |

---

## 12. Suites possibles

- **Page de suivi** `/signalement/{reference}` : le déclarant consulte l'état de son dossier avec sa référence et son e-mail.
- **Interface conformité** : liste filtrable par nature et statut, notes internes, export CSV pour la CENTIF.
- **Détection de doublons** : regrouper les signalements partageant un même domaine ou numéro, pour prioriser les faux sites les plus actifs.
- **Alerte publique** : une page listant les faux domaines confirmés, alimentée par les dossiers traités.
