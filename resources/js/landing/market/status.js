import { statusComponents } from '../content/data.js';

// DÉMO — historique de disponibilité sur 90 jours, dérivé de statusComponents (data.js).
// En production : fourni par l'outil de supervision (API de la page de statut).
export const DAYS = 90;
const RANK = { operational: 0, maintenance: 1, degraded: 2, partial: 3, major: 4 };
// Indisponibilité comptée par jour selon le niveau (en minutes).
const DOWNTIME = { operational: 0, maintenance: 0, degraded: 0, partial: 38, major: 95 };

export function statusData() {
  const groups = statusComponents.map((g) => ({
    group: g.group,
    items: g.items.map((c) => {
      const days = Array.from({ length: DAYS }, () => 'operational');
      for (const [ago, level] of c.incidents ?? []) days[DAYS - 1 - ago] = level;
      const down = days.reduce((s, d) => s + DOWNTIME[d], 0);
      return { ...c, days, uptime: 100 - (down / (DAYS * 1440)) * 100 };
    }),
  }));
  const all = groups.flatMap((g) => g.items);
  const worst = all.reduce((w, c) => (RANK[c.status] > RANK[w] ? c.status : w), 'operational');
  return { groups, worst };
}

export const worstOf = (items) => items.reduce((w, c) => (RANK[c.status] > RANK[w] ? c.status : w), 'operational');
