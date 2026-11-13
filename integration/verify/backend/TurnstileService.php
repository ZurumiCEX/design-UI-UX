<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    private const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    /**
     * La clé secrète reste côté serveur (config/services.php ← .env TURNSTILE_SECRET_KEY).
     * Quand Turnstile est désactivé (dev, préproduction), on laisse passer.
     */
    public function passes(?string $token, ?string $ip): bool
    {
        $secret = config('services.turnstile.secret');

        if (blank($secret)) {
            return true;
        }
        if (blank($token)) {
            return false;
        }

        $response = Http::asForm()->timeout(5)->post(self::ENDPOINT, [
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $ip,
        ]);

        return $response->successful() && $response->json('success') === true;
    }
}
