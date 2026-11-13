import { computed } from 'vue';

// Score de sécurité (DÉMO — pondération à valider) et recommandations associées.
const WEIGHTS = { password: 20, email: 10, phone: 10, totp: 30, passkey: 20, antiPhishing: 10 };

export function useSecurityScore(profile) {
  const score = computed(() => Object.entries(WEIGHTS).reduce((s, [k, w]) => s + (profile.security[k] ? w : 0), 0));
  const missing = computed(() => Object.keys(WEIGHTS).filter((k) => !profile.security[k]));
  return { score, missing };
}
