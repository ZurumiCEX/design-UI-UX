// Anglais — mêmes clés que fr.js. À TRADUIRE : pour l'instant, reprend le contenu français.
import createFr from './fr.js';

export default function createContent(linkOverrides) {
  return { ...createFr(linkOverrides), locale: 'en' };
}
