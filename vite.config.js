import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// Une page = un fichier HTML (l'équivalent d'une vue Blade) + une entrée JS.
const pages = {
  home: here('./index.html'),
  markets: here('./marches/index.html'),
  buy: here('./achat-rapide/index.html'),
  trade: here('./trade/index.html'),
  login: here('./connexion/index.html'),
  signup: here('./inscription/index.html'),
  convert: here('./convertir/index.html'),
  receive: here('./recevoir/index.html'),
  send: here('./envoyer/index.html'),
  p2p: here('./p2p/index.html'),
  verify: here('./verify/index.html'),
  report: here('./signaler-une-arnaque/index.html'),
  terms: here('./legal/conditions/index.html'),
  privacy: here('./legal/confidentialite/index.html'),
  risks: here('./legal/risques/index.html'),
  compliance: here('./legal/conformite/index.html'),
  wallet: here('./portefeuille/index.html'),
  account: here('./compte/index.html'),
  profile: here('./compte/profil/index.html'),
  security: here('./compte/securite/index.html'),
  kyc: here('./compte/verification/index.html'),
  forgot: here('./mot-de-passe-oublie/index.html'),
  status: here('./etat-des-services/index.html'),
};

// <!-- @include nom --> insère resources/views/partials/nom.html (l'équivalent d'un @include Blade).
const htmlPartials = {
  name: 'html-partials',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) => readFileSync(here(`./resources/views/partials/${name}.html`), 'utf8').trim()),
  },
};

export default defineConfig({
  appType: 'mpa',
  plugins: [vue(), htmlPartials],
  resolve: { alias: { '@landing': here('./resources/js/landing') } },
  build: { rolldownOptions: { input: pages } },
});
