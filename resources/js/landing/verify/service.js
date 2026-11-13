// Seule frontière entre l'interface et l'API de vérification.
import { mockVerify } from './mockApi.js';
import { VERIFY_STATE, isResultState } from './states.js';

const ENDPOINT = '/api/v1/verify';
const TIMEOUT_MS = 12000;
const useMock = () => (import.meta.env?.VITE_VERIFY_USE_MOCK ?? 'true') === 'true';

/** Erreur de service : `code` est traduit par l'interface (pages.verify.serviceErrors). */
export class VerifyServiceError extends Error {
  constructor(code, { retryable = true } = {}) {
    super(code);
    this.name = 'VerifyServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** Ramène toute réponse à la forme attendue. Inconnu → jamais « fraude ». */
function normaliseResponse(raw, fallbackType, fallbackValue) {
  return {
    status: isResultState(raw?.status) ? raw.status : VERIFY_STATE.UNKNOWN,
    type: raw?.type ?? fallbackType,
    value: raw?.value ?? fallbackValue,
    label: raw?.label ?? null,
    verifiedAt: raw?.verified_at ?? null,
    // risk_level n'est volontairement pas exposé : le score interne reste interne.
  };
}

export async function verifyIdentity({ type, value, turnstileToken = null, signal }) {
  const payload = { type, value };
  if (turnstileToken) payload.turnstile_token = turnstileToken;
  if (useMock()) return normaliseResponse(await mockVerify(payload), type, value);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (response.status === 429) throw new VerifyServiceError('rate_limited');
    if (response.status === 422) throw new VerifyServiceError('invalid_input', { retryable: false });
    if (!response.ok) throw new VerifyServiceError('server_error');
    return normaliseResponse(await response.json(), type, value);
  } catch (error) {
    if (error instanceof VerifyServiceError) throw error;
    if (error?.name === 'AbortError') throw new VerifyServiceError('timeout');
    throw new VerifyServiceError('network_error');
  } finally {
    clearTimeout(timer);
  }
}
