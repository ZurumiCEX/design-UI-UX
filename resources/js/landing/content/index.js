import { languages } from './data.js';
import createFr from './fr.js';

// fr est la référence, chargée d'emblée ; les autres langues sont importées à la demande.
const loaders = {
  en: () => import('./en.js'),
  pt: () => import('./pt.js'),
};

/** Langues proposées à l'utilisateur (sélecteur, ?lang=). */
export const locales = languages.map((l) => l.code);

/** Contenu français, synchrone. */
export const createDefaultContent = createFr;

/** Contenu d'une langue ; `links` remplace les liens par défaut (routes réelles). */
export async function loadContent(locale = 'fr', links = {}) {
  if (locale === 'fr' || !loaders[locale]) return createFr(links);
  return (await loaders[locale]()).default(links);
}
