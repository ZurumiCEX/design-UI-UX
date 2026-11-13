import { computed, reactive } from 'vue';
import { useI18n } from './useI18n.js';

// Notifications : contenu dans content/*-account.js (DÉMO), état « lu » gardé dans le navigateur.
// En production : liste fournie par l'API, marquage côté serveur.
const KEY = 'zurumi.notifications.read';
let initial = [];
try {
  initial = JSON.parse(localStorage.getItem(KEY) ?? '[]');
} catch {
  initial = [];
}
const read = reactive(new Set(initial));
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...read]));
  } catch {
    /* stockage indisponible */
  }
}

export function useNotifications() {
  const { i18n } = useI18n();
  const items = computed(() => (i18n.content.notifications?.items ?? []).map((n) => ({ ...n, read: n.read || read.has(n.id) })));
  const unread = computed(() => items.value.filter((n) => !n.read).length);
  return {
    items,
    unread,
    markRead(id) {
      read.add(id);
      persist();
    },
    markAll() {
      items.value.forEach((n) => read.add(n.id));
      persist();
    },
  };
}
