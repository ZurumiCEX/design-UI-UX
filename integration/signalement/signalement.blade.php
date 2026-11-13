{{-- resources/views/pages/signalement.blade.php --}}
@extends('layouts.app')

@section('title', 'Signaler une arnaque — Zurumi')
@section('meta_description', "Signalez une arnaque, une usurpation d'identité ou un abus lié à Zurumi. L'équipe conformité répond sous 48 heures ouvrées.")

@push('head')
    <link rel="canonical" href="{{ url('/signaler-une-arnaque') }}">
    <meta name="robots" content="index,follow">
    <meta property="og:title" content="Signaler une arnaque — Zurumi">
    <meta property="og:description" content="Un faux compte, un faux agent, un site qui imite Zurumi ? Signalez-le en deux minutes.">
    <meta property="og:url" content="{{ url('/signaler-une-arnaque') }}">
    <meta property="og:type" content="website">

    {{-- Inter : à retirer si la police est déjà chargée par le layout global --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        /* Fond sombre propre à cette page — le composant gère le reste. */
        .page-signalement {
            --z-primary: #5D3587;
            --z-secondary: #596FB7;
            background: #08070B;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }
        .page-signalement::before {
            content: "";
            position: absolute;
            inset: -30% -10% auto -10%;
            height: 70vh;
            pointer-events: none;
            background:
                radial-gradient(50% 60% at 20% 0%, rgba(93, 53, 135, .55), transparent 70%),
                radial-gradient(42% 52% at 80% 8%, rgba(89, 111, 183, .32), transparent 70%);
            filter: blur(20px);
        }
        .page-signalement > * { position: relative; z-index: 1; }
    </style>
@endpush

@section('content')
    <main class="page-signalement">
        <div
            id="signalement-app"
            data-endpoint="{{ route('signalements.store') }}"
            data-csrf="{{ csrf_token() }}"
            data-support-mail="{{ config('mail.security_address', 'securite@zurumi.com') }}"
        >
            {{-- Contenu de repli affiché avant l'hydratation Vue, et pour les robots d'indexation --}}
            <noscript>
                <div style="max-width:640px;margin:0 auto;padding:64px 24px;color:#F4F3F7;font-family:Inter,sans-serif">
                    <h1>Signaler une arnaque ou un abus</h1>
                    <p style="color:#9A94A8">
                        Le formulaire nécessite JavaScript. Écrivez directement à
                        <a style="color:#fff" href="mailto:{{ config('mail.security_address', 'securite@zurumi.com') }}">
                            {{ config('mail.security_address', 'securite@zurumi.com') }}
                        </a>
                        en décrivant les faits et en joignant vos captures d'écran.
                    </p>
                </div>
            </noscript>
        </div>
    </main>
@endsection

@push('scripts')
    {{-- Vite : le point d'entrée resources/js/signalement.js monte le composant --}}
    @vite(['resources/js/signalement.js'])
@endpush
