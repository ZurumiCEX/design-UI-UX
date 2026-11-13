import { seededRandom, seedFrom } from './random.js';

// Formats d'adresse par famille de réseau. Contrôle de confort uniquement :
// le serveur doit revalider (somme de contrôle, réseau, liste noire).
const PATTERNS = {
  evm: /^0x[a-fA-F0-9]{40}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  btc: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  ton: /^(EQ|UQ)[A-Za-z0-9_-]{46}$/,
  doge: /^D[1-9A-HJ-NP-Za-km-z]{25,34}$/,
  ada: /^addr1[02-9ac-hj-np-z]{50,110}$/,
};

export const isValidAddress = (family, value) => PATTERNS[family]?.test(String(value).trim()) ?? false;

/** Réseaux d'une crypto compatibles avec l'adresse saisie. */
export const matchingNetworks = (list, value) => list.filter((n) => isValidAddress(n.family, value));

/** Destinataire interne : e-mail, numéro mobile (8 à 15 chiffres) ou identifiant Zurumi. */
export function isValidRecipient(value) {
  const v = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || /^\+?\d[\d\s]{7,16}$/.test(v) || /^ZRM-?\d{6,10}$/i.test(v);
}

// DÉMO — adresses de dépôt VOLONTAIREMENT INVALIDES (elles contiennent « DEMO0 », hors alphabet du
// réseau) : aucun portefeuille ne les acceptera si la démo est mise en ligne par erreur.
// À remplacer par l'adresse fournie par l'API (une par utilisateur et par réseau).
const HEX = '0123456789abcdef';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const SHAPES = {
  evm: ['0xDEMO0', HEX, 35],
  tron: ['TDEMO0', B58, 28],
  btc: ['bc1qDEMO0', B32, 33],
  sol: ['DEMO0', B58, 39],
  xrp: ['rDEMO0', B58, 27],
  ton: ['UQDEMO0', B58, 33],
  doge: ['DDEMO0', B58, 28],
  ada: ['addr1DEMO0', B32, 50],
};

export function demoDepositAddress(network) {
  const rand = seededRandom(seedFrom(`deposit-${network.id}`));
  const [prefix, alphabet, length] = SHAPES[network.family] ?? SHAPES.evm;
  let out = prefix;
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(rand() * alphabet.length)];
  return out;
}

export function demoMemo(network) {
  const rand = seededRandom(seedFrom(`memo-${network.id}`));
  return `DEMO-${String(Math.floor(rand() * 1e6)).padStart(6, '0')}`;
}
