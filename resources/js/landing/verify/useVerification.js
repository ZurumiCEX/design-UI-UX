import { computed, ref, shallowRef } from 'vue';
import { verifyIdentity, VerifyServiceError } from './service.js';
import { isBusyState, PHASE_COUNT, RESULT_PRESETS, VERIFY_STATE } from './states.js';
import { DEFAULT_TYPE_ID, findType } from './types.js';
import { toAnalyticsShape, validate } from './validators.js';

const PHASE_INTERVAL_MS = 520;

// Machine à états de la vérification. Rien n'est persisté (ni stockage local, ni requête complète en statistiques).
export function useVerification({ onAnalytics = null } = {}) {
  const state = ref(VERIFY_STATE.IDLE);
  const typeId = ref(DEFAULT_TYPE_ID);
  const query = ref('');
  const fieldError = ref(null); // code de validation
  const serviceError = ref(null); // code d'erreur de service
  const result = shallowRef(null);
  const phaseIndex = ref(0);

  let phaseTimer = null;
  let inflight = null;

  const selectedType = computed(() => findType(typeId.value));
  const isBusy = computed(() => isBusyState(state.value));
  const canSubmit = computed(() => query.value.trim().length > 0 && !isBusy.value);
  const preset = computed(() => RESULT_PRESETS[state.value] ?? null);

  function stopPhases() {
    clearInterval(phaseTimer);
    phaseTimer = null;
  }
  function startPhases() {
    phaseIndex.value = 0;
    stopPhases();
    phaseTimer = setInterval(() => {
      if (phaseIndex.value < PHASE_COUNT - 1) phaseIndex.value += 1;
      else stopPhases();
    }, PHASE_INTERVAL_MS);
  }

  function reset({ keepQuery = false } = {}) {
    stopPhases();
    inflight?.abort();
    inflight = null;
    state.value = VERIFY_STATE.IDLE;
    result.value = null;
    fieldError.value = null;
    serviceError.value = null;
    phaseIndex.value = 0;
    if (!keepQuery) query.value = '';
  }

  function selectType(id) {
    if (id === typeId.value) return;
    typeId.value = id;
    fieldError.value = null;
    if (state.value !== VERIFY_STATE.IDLE) reset({ keepQuery: true });
  }

  async function submit({ turnstileToken = null } = {}) {
    if (isBusy.value) return;
    state.value = VERIFY_STATE.VALIDATING;
    serviceError.value = null;
    result.value = null;

    const check = validate(typeId.value, query.value);
    if (!check.valid) {
      fieldError.value = check.error;
      state.value = VERIFY_STATE.IDLE;
      return;
    }

    fieldError.value = null;
    state.value = VERIFY_STATE.CHECKING;
    startPhases();
    inflight = new AbortController();
    onAnalytics?.('verify_submitted', toAnalyticsShape(typeId.value, check.value));

    try {
      const payload = await verifyIdentity({ type: typeId.value, value: check.value, turnstileToken, signal: inflight.signal });
      await new Promise((resolve) => setTimeout(resolve, 180)); // laisse la dernière phase s'afficher
      result.value = payload;
      state.value = payload.status;
      onAnalytics?.('verify_result', { type: typeId.value, status: payload.status });
    } catch (error) {
      result.value = null;
      state.value = VERIFY_STATE.ERROR;
      serviceError.value = error instanceof VerifyServiceError ? error.code : 'unknown';
      onAnalytics?.('verify_error', { type: typeId.value, code: error?.code ?? 'unknown' });
    } finally {
      stopPhases();
      inflight = null;
    }
  }

  function dispose() {
    stopPhases();
    inflight?.abort();
  }

  return { state, typeId, query, fieldError, serviceError, result, phaseIndex, selectedType, isBusy, canSubmit, preset, selectType, submit, reset, dispose };
}
