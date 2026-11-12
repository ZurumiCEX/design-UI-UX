import { prefersReducedMotion } from './useReducedMotion.js';

/**
 * Découpe le texte d'un élément mot à mot (A1) en conservant <i> (atténué),
 * <b> (accent) et <br>. La phrase entière reste lisible par les lecteurs
 * d'écran via aria-label ; les mots découpés sont en aria-hidden.
 */
export function splitText(el) {
  if (!el || el.querySelector('.w') || prefersReducedMotion()) return;
  // les <br> comptent comme des espaces dans la phrase lue
  const plain = el.cloneNode(true);
  plain.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  const sentence = plain.textContent.replace(/\s+/g, ' ').trim();
  let index = 0;

  const build = (source, target) => {
    for (const node of [...source.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const part of node.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            target.append(' ');
          } else {
            const word = document.createElement('span');
            word.className = 'w';
            word.style.setProperty('--wi', index++);
            word.textContent = part;
            target.append(word);
          }
        }
      } else if (node.nodeName === 'BR') {
        target.append(document.createElement('br'));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        build(node, clone);
        target.append(clone);
      }
    }
  };

  const wrapper = document.createElement('span');
  wrapper.setAttribute('aria-hidden', 'true');
  build(el, wrapper);
  el.replaceChildren(wrapper);
  el.setAttribute('aria-label', sentence);
}

export function useSplitText() {
  return { splitText };
}
