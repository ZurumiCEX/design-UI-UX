// Types vérifiables. `id` est la valeur envoyée à l'API ; les libellés sont dans le contenu (pages.verify.types).
export const VERIFICATION_TYPES = Object.freeze([
  { id: 'website', inputMode: 'url', icon: 'globe', group: 'web' },
  { id: 'domain', inputMode: 'url', icon: 'globe', group: 'web' },
  { id: 'email', inputMode: 'email', icon: 'mail', group: 'contact' },
  { id: 'phone', inputMode: 'tel', icon: 'phone', group: 'contact' },
  { id: 'wallet', inputMode: 'text', icon: 'wallet', group: 'assets' },
  { id: 'telegram', inputMode: 'text', icon: 'telegram', group: 'social' },
  { id: 'x', inputMode: 'text', icon: 'x-social', group: 'social' },
  { id: 'instagram', inputMode: 'text', icon: 'instagram', group: 'social' },
  { id: 'tiktok', inputMode: 'text', icon: 'tiktok', group: 'social' },
  { id: 'facebook', inputMode: 'url', icon: 'facebook', group: 'social' },
  { id: 'linkedin', inputMode: 'url', icon: 'linkedin', group: 'social' },
  { id: 'representative', inputMode: 'text', icon: 'badge', group: 'people' },
]);

export const DEFAULT_TYPE_ID = 'website';

export const findType = (id) => VERIFICATION_TYPES.find((type) => type.id === id) ?? VERIFICATION_TYPES.find((type) => type.id === DEFAULT_TYPE_ID);
