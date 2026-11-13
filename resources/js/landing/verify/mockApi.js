// Registre FICTIF pour la démo sans back-end. À remplacer par le registre réel (VerificationRegistry côté Laravel).
// `label` est une clé traduite par l'interface (pages.verify.labels).
import { VERIFY_STATE } from './states.js';

const REGISTRY = [
  // Officiels
  { type: 'website', value: 'zurumi.com', status: VERIFY_STATE.VERIFIED, label: 'officialSite', risk_level: 'low' },
  { type: 'website', value: 'app.zurumi.com', status: VERIFY_STATE.VERIFIED, label: 'officialApp', risk_level: 'low' },
  { type: 'domain', value: 'zurumi.com', status: VERIFY_STATE.VERIFIED, label: 'rootDomain', risk_level: 'low' },
  { type: 'email', value: 'support@zurumi.com', status: VERIFY_STATE.VERIFIED, label: 'support', risk_level: 'low' },
  { type: 'email', value: 'compliance@zurumi.com', status: VERIFY_STATE.VERIFIED, label: 'compliance', risk_level: 'low' },
  { type: 'phone', value: '+221330000000', status: VERIFY_STATE.VERIFIED, label: 'phoneDakar', risk_level: 'low' },
  { type: 'telegram', value: '@zurumiofficial', status: VERIFY_STATE.VERIFIED, label: 'telegram', risk_level: 'low' },
  { type: 'x', value: '@zurumi', status: VERIFY_STATE.VERIFIED, label: 'x', risk_level: 'low' },
  { type: 'linkedin', value: 'linkedin.com/company/zurumi', status: VERIFY_STATE.VERIFIED, label: 'linkedin', risk_level: 'low' },
  { type: 'instagram', value: '@zurumi', status: VERIFY_STATE.VERIFIED, label: 'instagram', risk_level: 'low' },
  { type: 'tiktok', value: '@zurumi', status: VERIFY_STATE.VERIFIED, label: 'tiktok', risk_level: 'low' },
  { type: 'facebook', value: 'facebook.com/zurumi', status: VERIFY_STATE.VERIFIED, label: 'facebook', risk_level: 'low' },
  { type: 'wallet', value: '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3', status: VERIFY_STATE.VERIFIED, label: 'depositWallet', risk_level: 'low' },
  // Signalés / en cours d'examen
  { type: 'website', value: 'zurumi-airdrop.com', status: VERIFY_STATE.SUSPICIOUS, label: 'reportedDomain', risk_level: 'high' },
  { type: 'telegram', value: '@zurumi_support', status: VERIFY_STATE.SUSPICIOUS, label: 'reportedImpersonation', risk_level: 'high' },
  { type: 'tiktok', value: '@zurumi_officiel', status: VERIFY_STATE.SUSPICIOUS, label: 'reportedPromises', risk_level: 'high' },
  { type: 'instagram', value: '@zurumi.support', status: VERIFY_STATE.BLOCKED, label: 'confirmedImpersonation', risk_level: 'critical' },
  // Bloqués
  { type: 'website', value: 'zurumi-login.net', status: VERIFY_STATE.BLOCKED, label: 'confirmedPhishing', risk_level: 'critical' },
  { type: 'email', value: 'security@zurumi-verify.com', status: VERIFY_STATE.BLOCKED, label: 'confirmedSender', risk_level: 'critical' },
  // Connu mais insuffisant
  { type: 'representative', value: 'aminata diallo', status: VERIFY_STATE.UNKNOWN, label: null, risk_level: 'unknown' },
];

const normalise = (type, value) => {
  const v = String(value).trim().toLowerCase();
  if (['website', 'domain', 'linkedin', 'facebook'].includes(type)) return v.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  if (type === 'phone') return v.replace(/[^\d+]/g, '');
  if (['telegram', 'x', 'instagram', 'tiktok'].includes(type)) return v.startsWith('@') ? v : `@${v}`;
  return v;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockVerify(payload) {
  await delay(650 + Math.random() * 500);
  const needle = normalise(payload.type, payload.value);
  const match = REGISTRY.find((entry) => entry.type === payload.type && normalise(entry.type, entry.value) === needle);
  if (!match) return { status: VERIFY_STATE.UNVERIFIED, type: payload.type, value: payload.value, label: null, risk_level: 'unknown', verified_at: null };
  return {
    status: match.status,
    type: match.type,
    value: match.value,
    label: match.label,
    risk_level: match.risk_level,
    verified_at: match.status === VERIFY_STATE.VERIFIED ? new Date().toISOString() : null,
  };
}
