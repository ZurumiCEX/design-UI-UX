import { markRaw, reactive } from 'vue';
import { createDefaultContent, loadContent, locales } from '../content/index.js';
import { USD_XOF } from '../content/data.js';
import { useProfile } from './useProfile.js';

// Devise d'affichage choisie dans la barre (XOF ou USD), partagée avec le portefeuille.
const { prefs } = useProfile();

// État de langue partagé par toute la page : langue courante, contenu, page affichée.
const TAGS = { fr: 'fr-FR', en: 'en-US', pt: 'pt-PT' };
const STORAGE_KEY = 'zurumi.locale';

const state = reactive({ locale: 'fr', page: 'home', links: {}, content: markRaw(createDefaultContent()) });

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function store(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* stockage indisponible : la langue ne sera pas mémorisée */
  }
}

/** Ordre de priorité : ?lang=, choix mémorisé, configuration de l'hôte, <html lang>. */
export function detectLocale(config = {}) {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  const candidates = [fromUrl, readStored(), config.locale, document.documentElement.lang];
  return candidates.find((l) => l && locales.includes(l)) ?? 'fr';
}

function applyMeta() {
  const doc = state.content.legal?.docs?.[state.page];
  const meta = state.content.pages?.[state.page]?.meta ?? (doc && { title: `${doc.title} — Zurumi`, description: doc.intro });
  if (!meta) return;
  document.title = meta.title;
  const set = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  set('meta[name="description"]', meta.description);
  set('meta[property="og:title"]', meta.title);
  set('meta[property="og:description"]', meta.description);
  set('meta[property="og:locale"]', TAGS[state.locale].replace('-', '_'));
}

export async function setLocale(locale, { persist = true } = {}) {
  if (!locales.includes(locale)) return;
  const content = await loadContent(locale, state.links);
  state.content = markRaw(content);
  state.locale = locale;
  document.documentElement.lang = locale;
  if (persist) store(locale);
  applyMeta();
}

export async function initI18n({ page, config = {} }) {
  state.page = page;
  state.links = config.links ?? {};
  await setLocale(detectLocale(config), { persist: false });
}

/** Remplace {cle} par vars.cle. */
export function t(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Découpe un gabarit en morceaux de texte et en emplacements ({cle}) pour y insérer des liens. */
export function parts(str) {
  return String(str)
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((p) => (/^\{\w+\}$/.test(p) ? { slot: p.slice(1, -1) } : { text: p }));
}

// ---------- Formats (suivent la langue courante) ----------
const cache = new Map();
function cached(Ctor, opts) {
  const tag = TAGS[state.locale] ?? 'fr-FR';
  const key = `${Ctor.name}|${tag}|${JSON.stringify(opts)}`;
  if (!cache.has(key)) cache.set(key, new Ctor(tag, opts));
  return cache.get(key);
}
const minus = (s) => s.replace(/-(?=\d)/g, '−'); // vrai signe moins

/** Nombre de décimales d'un prix selon son ordre de grandeur. */
export function priceDecimals(v) {
  const a = Math.abs(v);
  if (a >= 1000) return 2;
  if (a >= 1) return 4;
  if (a >= 0.01) return 5;
  return 7;
}

export const fmt = {
  num: (v, min = 0, max = min) => minus(cached(Intl.NumberFormat, { minimumFractionDigits: min, maximumFractionDigits: max }).format(v)),
  price: (v, decimals = priceDecimals(v)) => fmt.num(v, decimals),
  xof: (v) => `${fmt.num(v, Math.abs(v) >= 100 ? 0 : 2)} XOF`,
  // Montant exprimé en XOF, affiché dans la devise choisie (XOF ou USD).
  moneyParts: (v) => (prefs.currency === 'USD' ? { n: fmt.price(v / USD_XOF), unit: 'USD' } : { n: fmt.num(v, Math.abs(v) >= 100 ? 0 : 2), unit: 'XOF' }),
  money: (v) => {
    const m = fmt.moneyParts(v);
    return `${m.n} ${m.unit}`;
  },
  pct: (v) =>
    minus(
      cached(Intl.NumberFormat, { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v / 100),
    ),
  compact: (v) => cached(Intl.NumberFormat, { notation: 'compact', maximumFractionDigits: 2 }).format(v),
  date: (ts, opts) => cached(Intl.DateTimeFormat, opts).format(ts),
  /** « il y a 5 min », « hier »… à partir d'un nombre de minutes écoulées. */
  ago: (minutes) => {
    const rtf = cached(Intl.RelativeTimeFormat, { numeric: 'auto' });
    if (minutes < 1) return rtf.format(0, 'minute');
    if (minutes < 60) return rtf.format(-Math.round(minutes), 'minute');
    if (minutes < 1440) return rtf.format(-Math.round(minutes / 60), 'hour');
    return rtf.format(-Math.round(minutes / 1440), 'day');
  },
  /** Analyse une saisie localisée (« 50 000,5 », « 50,000.5 ») ; NaN si invalide. */
  parse: (input) => {
    const raw = String(input ?? '').replace(/[\s  ]/g, '');
    if (!raw) return NaN;
    const decimal = state.locale === 'en' ? '.' : ',';
    const group = decimal === '.' ? /,/g : /\./g;
    const normal = raw.replace(group, '').replace(decimal, '.').replace(/,/g, '.');
    return /^\d*\.?\d+$|^\d+\.$/.test(normal) ? Number(normal) : NaN;
  },
};

export function useI18n() {
  return { i18n: state, fmt, t, parts, setLocale };
}
