// Génère resources/css/tokens.css depuis docs/design/zurumi-tokens.json (format W3C DTCG).
// Ne modifiez pas tokens.css à la main : changez le JSON puis lancez `npm run tokens`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = new URL('docs/design/zurumi-tokens.json', root);
const target = new URL('resources/css/tokens.css', root);
const tokens = JSON.parse(readFileSync(source, 'utf8'));

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const lines = [];

function value(token) {
  const v = token.$value;
  switch (token.$type) {
    case 'gradient': {
      const angle = /^(\d+deg)/.exec(token.$description ?? '')?.[1] ?? '90deg';
      return `linear-gradient(${angle}, ${v.map((s) => `${s.color} ${s.position * 100}%`).join(', ')})`;
    }
    case 'cubicBezier':
      return `cubic-bezier(${v.join(', ')})`;
    case 'fontFamily':
      return `"${v}", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    default:
      return String(v);
  }
}

function walk(node, path) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const next = [...path, kebab(key)];
    if (child && typeof child === 'object' && '$value' in child) {
      const name = `--${next.join('-')}`;
      lines.push(`  ${name}: ${value(child)};`);
      // Une taille fluide est décrite par un clamp() dans $description.
      const fluid = /^clamp\(.+\)$/.exec(child.$description ?? '');
      if (fluid) lines.push(`  ${name}-fluid: ${fluid[0]};`);
    } else if (child && typeof child === 'object') {
      walk(child, next);
    }
  }
}

walk(tokens, []);
const css = `/* GÉNÉRÉ par scripts/build-tokens.mjs depuis docs/design/zurumi-tokens.json — ne pas modifier. */\n:root {\n${lines.join('\n')}\n}\n`;
writeFileSync(target, css);
console.log(`tokens.css : ${lines.length} variables → ${fileURLToPath(target)}`);
