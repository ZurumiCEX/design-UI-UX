// Session fournie par l'hôte : window.__LANDING__.user = { name, … } quand l'utilisateur est connecté.
// Sans hôte (squelette), l'utilisateur est toujours déconnecté.
export function useSession() {
  const config = typeof window !== 'undefined' ? (window.__LANDING__ ?? {}) : {};
  return { user: config.user ?? null };
}
