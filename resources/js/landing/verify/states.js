// États de vérification et présentation de chaque résultat (ton, icône, actions).
// Les textes correspondants sont dans le contenu : pages.verify.results[état].
export const VERIFY_STATE = Object.freeze({
  IDLE: 'idle',
  VALIDATING: 'validating',
  CHECKING: 'checking',
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  SUSPICIOUS: 'suspicious',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
  ERROR: 'error',
});

export const RESULT_STATES = Object.freeze([
  VERIFY_STATE.VERIFIED,
  VERIFY_STATE.UNVERIFIED,
  VERIFY_STATE.SUSPICIOUS,
  VERIFY_STATE.BLOCKED,
  VERIFY_STATE.UNKNOWN,
]);

export const isResultState = (state) => RESULT_STATES.includes(state);
export const isBusyState = (state) => state === VERIFY_STATE.VALIDATING || state === VERIFY_STATE.CHECKING;

// Vérifié = violet Zurumi (jamais vert) ; non vérifié / impossible = bleu neutre, jamais rouge.
export const RESULT_PRESETS = Object.freeze({
  [VERIFY_STATE.VERIFIED]: { tone: 'verified', icon: 'check', primary: 'reset', secondary: 'report' },
  [VERIFY_STATE.UNVERIFIED]: { tone: 'neutral', icon: 'question', primary: 'reset', secondary: 'report' },
  [VERIFY_STATE.SUSPICIOUS]: { tone: 'warning', icon: 'alert', primary: 'report', secondary: 'reset' },
  [VERIFY_STATE.BLOCKED]: { tone: 'danger', icon: 'shield-off', primary: 'reset', secondary: 'report' },
  [VERIFY_STATE.UNKNOWN]: { tone: 'neutral', icon: 'question', primary: 'reset', secondary: 'report' },
  [VERIFY_STATE.ERROR]: { tone: 'neutral', icon: 'alert', primary: 'retry', secondary: 'support' },
});

export const PHASE_COUNT = 3;
