import { reactive } from 'vue';

// Notifications éphémères (« toasts ») : une file partagée, affichée par <ZToaster />.
const toasts = reactive([]);
let id = 0;

export function toast(text, { tone = 'info', duration = 4200 } = {}) {
  const item = { id: ++id, text, tone };
  toasts.push(item);
  setTimeout(() => dismiss(item.id), duration);
}
export function dismiss(itemId) {
  const i = toasts.findIndex((t) => t.id === itemId);
  if (i !== -1) toasts.splice(i, 1);
}
export function useToast() {
  return { toasts, toast, dismiss };
}
