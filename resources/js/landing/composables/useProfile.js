import { reactive, watch } from 'vue';
import { demoUser } from '../content/data.js';

// Profil de l'utilisateur connecté, partagé par la barre, le portefeuille et l'espace client.
// Hôte : window.__LANDING__.user. Sans hôte : utilisateur de DÉMO, modifications gardées dans le navigateur.
const KEY = 'zurumi.demo.profile';
const PREFS = 'zurumi.prefs';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : rien n'est mémorisé */
  }
}

const host = typeof window !== 'undefined' ? window.__LANDING__?.user : null;
const clone = (o) => JSON.parse(JSON.stringify(o));
const profile = reactive(host ? { ...clone(demoUser), ...host } : { ...clone(demoUser), ...(read(KEY) ?? {}) });
// Préférences d'affichage (toujours locales) : solde masqué, devise.
const prefs = reactive({ hideBalance: false, currency: profile.currency ?? 'XOF', ...(read(PREFS) ?? {}) });
watch(prefs, (v) => write(PREFS, v), { deep: true });

export function useProfile() {
  return {
    profile,
    prefs,
    demo: !host,
    /** Enregistre des champs (démo : dans le navigateur ; en production, après la réponse du serveur). */
    save(fields) {
      Object.assign(profile, clone(fields));
      if (fields.currency) prefs.currency = fields.currency;
      if (!host) write(KEY, profile);
    },
    initials: () => `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'Z',
  };
}
