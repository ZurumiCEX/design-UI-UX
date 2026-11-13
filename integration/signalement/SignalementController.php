<?php
// app/Http/Controllers/SignalementController.php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSignalementRequest;
use App\Mail\SignalementAccuseReception;
use App\Mail\SignalementInterne;
use App\Models\Signalement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SignalementController extends Controller
{
    /** Affiche la page publique. */
    public function create()
    {
        return view('pages.signalement');
    }

    /** Enregistre un signalement et ses pièces jointes. */
    public function store(StoreSignalementRequest $request): JsonResponse
    {
        // --- Barrières anti-robot silencieuses -------------------------------
        // On répond 200 avec une fausse référence : un robot ne doit pas
        // apprendre qu'il a été détecté, et un humain n'arrive jamais ici.
        if (filled($request->input('site_entreprise'))) {
            Log::channel('security')->info('Signalement rejeté : honeypot rempli', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['reference' => $this->reference()], 201);
        }

        if ((int) $request->input('duree_remplissage') < 5000) {
            Log::channel('security')->info('Signalement rejeté : formulaire rempli trop vite', [
                'ip'    => $request->ip(),
                'duree' => $request->input('duree_remplissage'),
            ]);

            return response()->json(['reference' => $this->reference()], 201);
        }

        // --- Enregistrement ---------------------------------------------------
        $signalement = new Signalement([
            'reference'   => $this->reference(),
            'type'        => $request->input('type'),
            'description' => $request->input('description'),
            'canal'       => $request->input('canal'),
            'date_faits'  => $request->input('date'),
            'lien'        => $request->input('lien'),
            'montant'     => $request->input('montant'),
            'devise'      => $request->input('devise'),
            'nom'         => $request->input('nom'),
            'telephone'   => $request->input('telephone'),
            'email'       => $request->input('email'),
            'statut'      => Signalement::STATUT_NOUVEAU,
            'ip_hash'     => hash('sha256', $request->ip() . config('app.key')),
            'user_agent'  => Str::limit((string) $request->userAgent(), 255, ''),
        ]);
        $signalement->save();

        // --- Pièces jointes : disque privé, jamais public ---------------------
        foreach ($request->file('preuves', []) as $fichier) {
            $chemin = $fichier->store("signalements/{$signalement->reference}", 'preuves');

            $signalement->preuves()->create([
                'chemin'       => $chemin,
                'nom_original' => Str::limit($fichier->getClientOriginalName(), 180, ''),
                'mime'         => $fichier->getMimeType(),
                'taille'       => $fichier->getSize(),
            ]);
        }

        // --- Notifications ----------------------------------------------------
        // En file d'attente : la réponse HTTP ne doit pas attendre le SMTP.
        Mail::to(config('mail.security_address', 'securite@zurumi.com'))
            ->queue(new SignalementInterne($signalement));

        if ($signalement->email) {
            Mail::to($signalement->email)->queue(new SignalementAccuseReception($signalement));
        }

        Log::channel('security')->info('Signalement enregistré', [
            'reference' => $signalement->reference,
            'type'      => $signalement->type,
            'preuves'   => $signalement->preuves()->count(),
        ]);

        return response()->json([
            'reference' => $signalement->reference,
            'message'   => 'Signalement enregistré.',
        ], 201);
    }

    /** Référence lisible et sans caractères ambigus (ni 0/O ni 1/I/B8). */
    private function reference(): string
    {
        $alphabet = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
        $suffixe  = '';

        for ($i = 0; $i < 6; $i++) {
            $suffixe .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return 'ZRM-SIG-' . $suffixe;
    }
}
