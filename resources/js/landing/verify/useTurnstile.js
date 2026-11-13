import { onBeforeUnmount, onMounted, ref } from 'vue'

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Cloudflare Turnstile in invisible mode.
 * Only the PUBLIC site key is used here; the secret key never leaves the Laravel backend,
 * which validates the token on POST /api/v1/verify.
 *
 * Set VITE_TURNSTILE_SITE_KEY to enable. When unset, the composable no-ops so the page
 * still works in local development and in the mock demo.
 */
export function useTurnstile(containerRef, language = 'fr') {
  const siteKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) || ''
  const ready = ref(false)
  const enabled = Boolean(siteKey)
  let widgetId = null

  function loadScript() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve()
      const existing = document.getElementById(SCRIPT_ID)
      if (existing) return existing.addEventListener('load', () => resolve(), { once: true })
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('turnstile_script_failed'))
      document.head.appendChild(script)
    })
  }

  onMounted(async () => {
    if (!enabled || !containerRef?.value) return
    try {
      await loadScript()
      widgetId = window.turnstile.render(containerRef.value, {
        sitekey: siteKey,
        size: 'invisible',
        appearance: 'interaction-only',
        theme: 'dark',
        language,
      })
      ready.value = true
    } catch {
      ready.value = false
    }
  })

  onBeforeUnmount(() => {
    if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId)
  })

  /** @returns {Promise<string|null>} a single-use token, or null when Turnstile is off. */
  async function getToken() {
    if (!enabled || !ready.value || !window.turnstile) return null
    try {
      window.turnstile.reset(widgetId)
      return await window.turnstile.execute(widgetId, { async: true })
    } catch {
      return null
    }
  }

  return { enabled, ready, getToken }
}
