// Génère resources/js/landing/components/visuals/world.json : contours simplifiés des continents
// (Afrique en 1:50m, reste du monde en 1:110m), masque terre/mer de la grille de points du globe,
// et gros plan Afrique de l'Ouest (frontières 1:50m de 9 pays + voisins, grille de points dense).
// Données : Natural Earth (domaine public), via le paquet world-atlas.
// Non lancé au build. Pour régénérer :
//   npm i --no-save world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1 && node scripts/build-world.mjs
// La grille (STEP, K) doit rester identique à celle de DotGlobe.vue.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const load = (f) => JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/' + f, import.meta.url)));
const land110 = feature(load('land-110m.json'), load('land-110m.json').objects.land);
const land50 = feature(load('land-50m.json'), load('land-50m.json').objects.land);
// Un contour « touche l'Afrique » si sa boîte englobante recoupe celle du continent
// (Afrique et Eurasie forment un seul contour dans les données, relié par le Sinaï).
const touchesAfrica = (r) => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, y] of r) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); } return b > -20 && a < 55 && d > -37 && c < 38; };
function rings(f) { const out = []; for (const poly of f.geometry ? [f.geometry] : f.features.map(x=>x.geometry)) { const ps = poly.type === 'Polygon' ? [poly.coordinates] : poly.coordinates; for (const p of ps) for (const r of p) out.push(r); } return out; }
function dp(pts, tol) { if (pts.length < 3) return pts; let max = 0, idx = 0; const [a, b] = [pts[0], pts[pts.length - 1]];
  for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; const dx = b[0] - a[0], dy = b[1] - a[1]; const L = Math.hypot(dx, dy) || 1e-9; const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / L; if (d > max) { max = d; idx = i; } }
  if (max > tol) return dp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(dp(pts.slice(idx), tol)); return [a, b]; }
const dpRing = (r, tol) => { const h = Math.floor(r.length / 2); return dp(r.slice(0, h + 1), tol).slice(0, -1).concat(dp(r.slice(h), tol)); };
const area = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s / 2); };
const centroid = (r) => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
const Q = 4; // 0,25°
const outRings = [];
let pts = 0;
for (const r of rings(land50)) { if (!touchesAfrica(r) || area(r) < 0.8) continue; const s = dpRing(r, 0.22); if (s.length < 4) continue; outRings.push(s); pts += s.length; }
for (const r of rings(land110)) { if (touchesAfrica(r) || area(r) < 6) continue; const s = dpRing(r, 0.55); if (s.length < 4) continue; outRings.push(s); pts += s.length; }
// encodage : entiers en quarts de degré, différentiels
const enc = outRings.map((r) => { const a = []; let px = 0, py = 0; for (const [x, y] of r) { const qx = Math.round(x * Q), qy = Math.round(y * Q); a.push(qx - px, qy - py); px = qx; py = qy; } return a; });
// masque terre pour la grille de points (même formule que le composant)
const STEP = 3, K = 120; let bits = '';
for (let lat = -84; lat <= 84; lat += STEP) { const n = Math.max(6, Math.round(K * Math.cos(lat * Math.PI / 180))); for (let i = 0; i < n; i++) { let lon = (i / n) * 360; if (lon > 180) lon -= 360; bits += geoContains(land110, [lon, lat]) ? '1' : '0'; } }
const bytes = Buffer.alloc(Math.ceil(bits.length / 8)); for (let i = 0; i < bits.length; i++) if (bits[i] === '1') bytes[i >> 3] |= 1 << (i & 7);
// ---------- Gros plan Afrique de l'Ouest : frontières des pays et grille de points dense ----------
const countries50 = feature(load('countries-50m.json'), load('countries-50m.json').objects.countries);
// pays du réseau (mis en avant) et voisins (contexte, plus discrets) — codes ISO 3166 numériques
const FOCUS = { 686: 'sn', 478: 'mr', 384: 'ci', 324: 'gn', 466: 'ml', 854: 'bf', 270: 'gm', 768: 'tg', 204: 'bj' };
const NEIGHBOURS = [624, 430, 694, 288, 562, 566, 12, 504, 732, 148, 120];
const regionRings = (f, tol) => {
  const g = f.geometry; const ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; const out = [];
  for (const poly of ps) { const r = poly[0]; if (area(r) < 0.05) continue; const s2 = dpRing(r, tol); if (s2.length >= 4) out.push(s2); }
  return out;
};
const encRing = (r) => { const a = []; let px = 0, py = 0; for (const [x, y] of r) { const qx = Math.round(x * 20), qy = Math.round(y * 20); a.push(qx - px, qy - py); px = qx; py = qy; } return a; };
const region = { q: 20, countries: [] };
for (const f of countries50.features) {
  const id = +f.id;
  if (FOCUS[id]) region.countries.push({ iso: FOCUS[id], focus: true, rings: regionRings(f, 0.04).map(encRing) });
  else if (NEIGHBOURS.includes(id)) region.countries.push({ iso: String(id), focus: false, rings: regionRings(f, 0.06).map(encRing) });
}
const R = { lat0: -2, lat1: 30, lon0: -26, lon1: 16, step: 0.8 };
let rbits = '';
for (let la = R.lat0; la <= R.lat1 + 1e-9; la += R.step) for (let lo = R.lon0; lo <= R.lon1 + 1e-9; lo += R.step) rbits += geoContains(land50, [lo, la]) ? '1' : '0';
const rbytes = Buffer.alloc(Math.ceil(rbits.length / 8)); for (let i = 0; i < rbits.length; i++) if (rbits[i] === '1') rbytes[i >> 3] |= 1 << (i & 7);
region.grid = { ...R, land: rbytes.toString('base64') };

const out = { source: 'Natural Earth (domaine public) via world-atlas 2.0.2 — généré par scripts/build-world.mjs', q: Q, grid: { step: STEP, k: K, count: bits.length }, land: bytes.toString('base64'), rings: enc, region };
fs.writeFileSync(new URL('../resources/js/landing/components/visuals/world.json', import.meta.url), JSON.stringify(out));
console.log('rings', outRings.length, 'points', pts, 'gridDots', bits.length, 'land%', (bits.split('').filter(b=>b==='1').length / bits.length * 100).toFixed(0), 'bytes', 'ok');
