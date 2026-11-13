// Validation client : confort d'usage, pas un contrôle de sécurité (le serveur revalide).
// Renvoie un code d'erreur traduit par l'interface (pages.verify.errors).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;
const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,20}$/;
const HANDLE_RE = /^@?[a-z0-9_.]{2,40}$/i;
const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const GENERIC_ADDRESS_RE = /^[a-zA-Z0-9:_-]{20,120}$/;
const MAX_LENGTH = 256;

/** Supprime les espaces superflus et les caractères invisibles utilisés dans les attaques par homographe. */
export function sanitize(value) {
  return String(value ?? '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const stripScheme = (value) => value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
const ok = (value) => ({ valid: true, value, error: null });
const ko = (value, error) => ({ valid: false, value, error });

/** @returns {{ valid: boolean, value: string, error: string|null }} */
export function validate(typeId, rawValue) {
  const value = sanitize(rawValue);
  if (!value) return ko(value, 'empty');
  if (value.length > MAX_LENGTH) return ko(value, 'tooLong');

  switch (typeId) {
    case 'website':
    case 'domain':
      return DOMAIN_RE.test(stripScheme(value)) ? ok(value) : ko(value, 'domain');
    case 'email':
      return EMAIL_RE.test(value) ? ok(value) : ko(value, 'email');
    case 'phone':
      return PHONE_RE.test(value) ? ok(value) : ko(value, 'phone');
    case 'wallet':
      return EVM_RE.test(value) || GENERIC_ADDRESS_RE.test(value) ? ok(value) : ko(value, 'wallet');
    case 'telegram':
    case 'x':
    case 'instagram':
    case 'tiktok':
      return HANDLE_RE.test(value) ? ok(value) : ko(value, 'handle');
    case 'facebook':
    case 'linkedin':
      return DOMAIN_RE.test(stripScheme(value)) || HANDLE_RE.test(value) ? ok(value) : ko(value, 'page');
    case 'representative':
      return value.length >= 2 ? ok(value) : ko(value, 'representative');
    default:
      return ok(value);
  }
}

/** Empreinte anonymisée pour les statistiques : jamais la valeur complète. */
export function toAnalyticsShape(typeId, value) {
  const length = sanitize(value).length;
  return { type: typeId, length_bucket: length <= 16 ? 'short' : length <= 48 ? 'medium' : 'long' };
}
