// Génère resources/js/landing/components/visuals/world.json : contours simplifiés des continents
// (Afrique en 1:50m, reste du monde en 1:110m) et masque terre/mer de la grille de points du globe.
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
const out = { source: 'Natural Earth (domaine public) via world-atlas 2.0.2 — généré par scripts/build-world.mjs', q: Q, grid: { step: STEP, k: K, count: bits.length }, land: bytes.toString('base64'), rings: enc };
fs.writeFileSync(new URL('../resources/js/landing/components/visuals/world.json', import.meta.url), JSON.stringify(out));
console.log('rings', outRings.length, 'points', pts, 'gridDots', bits.length, 'land%', (bits.split('').filter(b=>b==='1').length / bits.length * 100).toFixed(0), 'bytes', 'ok');
