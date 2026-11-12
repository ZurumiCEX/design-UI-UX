// Portugais — mêmes clés que fr.js. À TRADUIRE : reprend le contenu français et n'est pas proposé
// dans le sélecteur de langue (voir `languages` dans data.js) tant que la traduction n'est pas faite.
import createFr from './fr.js';

export default function createContent(linkOverrides) {
  return { ...createFr(linkOverrides), locale: 'pt' };
}
