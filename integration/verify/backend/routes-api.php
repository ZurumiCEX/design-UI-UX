<?php
// routes/api.php — extrait à fusionner dans le routeur Zurumi.

use App\Http\Controllers\Api\V1\VerifyController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 10 requêtes / minute / IP, adossé à Redis. Le front n'affiche jamais de score interne.
    Route::post('/verify', [VerifyController::class, 'store'])
        ->middleware('throttle:verify')
        ->name('api.v1.verify');
});

// AppServiceProvider::boot() ou RouteServiceProvider :
// RateLimiter::for('verify', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
