<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\VerifyRequest;
use App\Services\Security\TurnstileService;
use App\Services\Security\VerificationRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VerifyController extends Controller
{
    public function __construct(
        private readonly TurnstileService $turnstile,
        private readonly VerificationRegistry $registry,
    ) {}

    public function store(VerifyRequest $request): JsonResponse
    {
        if (! $this->turnstile->passes($request->input('turnstile_token'), $request->ip())) {
            return response()->json(['message' => 'Vérification anti-robot requise.'], 403);
        }

        $type = $request->string('type')->toString();
        $value = $this->registry->normalise($type, $request->string('value')->toString());

        // Cache court : le registre change rarement, les campagnes de phishing sont massives.
        $record = Cache::remember(
            "verify:{$type}:" . hash('sha256', $value),
            now()->addMinutes(5),
            fn () => $this->registry->lookup($type, $value),
        );

        // Journalisation : jamais la valeur complète soumise par l'utilisateur.
        Log::channel('security')->info('verify.query', [
            'type' => $type,
            'status' => $record['status'],
            'value_hash' => substr(hash('sha256', $value), 0, 16),
        ]);

        return response()->json([
            'status' => $record['status'],       // verified|unverified|suspicious|blocked|unknown
            'type' => $type,
            'value' => $record['value'] ?? $value,
            'label' => $record['label'] ?? null,
            'risk_level' => $record['public_risk'] ?? 'unknown', // jamais le score interne
            'verified_at' => $record['verified_at'] ?? null,
        ])->header('Cache-Control', 'no-store');
    }
}
