// Validation côté client (le serveur reste seul juge).
export function validateIdentifier({ method, email, phone }) {
  if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? '' : 'email';
  return /^\d{8,10}$/.test(phone.replace(/[\s.-]/g, '')) ? '' : 'phone';
}

export function passwordRules(pw) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
  };
}

/** Pré-remplissage depuis ?identifier= (formulaire du hero). */
export function identifierFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('identifier')?.trim() ?? '';
  if (!raw) return null;
  return raw.includes('@') ? { method: 'email', email: raw } : { method: 'phone', phone: raw.replace(/[^\d]/g, '') };
}
