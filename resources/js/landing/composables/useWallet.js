import { demoBalances } from '../content/data.js';
import { useSession } from './useSession.js';

// Soldes de l'utilisateur fournis par l'hôte (window.__LANDING__.user.balances),
// sinon soldes de démonstration (`demo: true`, à signaler dans l'interface).
export function useWallet() {
  const { user } = useSession();
  const balances = user?.balances ?? demoBalances;
  return { balances, demo: !user?.balances, balanceOf: (id) => balances[id] ?? 0 };
}
