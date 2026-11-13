<?php
// app/Http/Requests/StoreSignalementRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSignalementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // formulaire public
    }

    /**
     * Ces règles font autorité. La validation du composant Vue est un confort
     * d'usage : elle se contourne en trois secondes avec les devtools.
     */
    public function rules(): array
    {
        return [
            'type'        => ['required', 'string', 'in:faux-site,usurpation,investissement,compte,p2p,autre'],
            'description' => ['required', 'string', 'min:40', 'max:5000'],
            'canal'       => ['nullable', 'string', 'max:60'],
            'date'        => ['nullable', 'date', 'before_or_equal:today', 'after:2015-01-01'],
            'lien'        => ['nullable', 'string', 'max:500'],
            'montant'     => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'devise'      => ['nullable', 'string', 'in:XOF,USDT,EUR,USD,Autre'],
            'nom'         => ['nullable', 'string', 'max:120'],
            'telephone'   => ['nullable', 'string', 'max:30'],
            'email'       => ['required', 'email:rfc,dns', 'max:190'],
            'consent'     => ['required', 'accepted'],

            // Anti-robot : traités dans le contrôleur, jamais rejetés en 422
            // pour ne pas indiquer à un automate ce qui l'a trahi.
            'site_entreprise'   => ['nullable', 'string', 'max:255'],
            'duree_remplissage' => ['nullable', 'integer'],

            // Pièces jointes : le contrôle porte sur le contenu réel du fichier
            // (mimetypes), pas sur l'extension ni sur l'en-tête déclaré.
            'preuves'   => ['nullable', 'array', 'max:5'],
            'preuves.*' => [
                'file',
                'max:10240', // kilo-octets, soit 10 Mo
                'mimetypes:image/jpeg,image/png,image/webp,application/pdf',
                'mimes:jpg,jpeg,png,webp,pdf',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'        => 'Choisissez la nature du signalement.',
            'type.in'              => 'Nature de signalement inconnue.',
            'description.required' => 'Décrivez les faits.',
            'description.min'      => 'Décrivez les faits en 40 caractères minimum.',
            'description.max'      => 'La description ne peut pas dépasser 5 000 caractères.',
            'email.required'       => 'Une adresse e-mail est nécessaire pour le suivi du dossier.',
            'email.email'          => 'Entrez une adresse e-mail valide.',
            'consent.accepted'     => 'Cette confirmation est nécessaire pour envoyer le signalement.',
            'date.before_or_equal' => 'La date des faits ne peut pas être dans le futur.',
            'preuves.max'          => '5 fichiers maximum.',
            'preuves.*.max'        => 'Chaque fichier doit peser moins de 10 Mo.',
            'preuves.*.mimetypes'  => 'Formats acceptés : JPG, PNG, WEBP ou PDF.',
            'preuves.*.mimes'      => 'Formats acceptés : JPG, PNG, WEBP ou PDF.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email'       => trim((string) $this->input('email')),
            'description' => trim((string) $this->input('description')),
            'consent'     => filter_var($this->input('consent'), FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
