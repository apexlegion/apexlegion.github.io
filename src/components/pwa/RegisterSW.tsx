import { useEffect } from 'react';

/**
 * Registers `/sw.js` as the page's service worker.
 *
 * - No-ops gracefully when `navigator.serviceWorker` is unavailable (e.g. SSR,
 *   older browsers, disabled in settings).
 * - Uses a same-origin scope so GitHub Pages serves the SW from `/sw.js`.
 * - Renders nothing.
 */
export interface RegisterSWProps {
  /** Override the script URL. Defaults to `/sw.js` (same-origin scope). */
  scriptUrl?: string;
}

export function RegisterSW({ scriptUrl = '/sw.js' }: RegisterSWProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Avoid registering during HMR if the module re-runs.
    const register = async () => {
      try {
        await navigator.serviceWorker.register(scriptUrl, { scope: '/' });
      } catch {
        // Service worker registration failed (HTTPS missing, etc). Fail
        // silently — the app still works online.
      }
    };

    // Defer registration until the window has finished loading so we never
    // compete with critical resources for bandwidth.
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
      return () => window.removeEventListener('load', () => void register());
    }
    return undefined;
  }, [scriptUrl]);

  return null;
}

export default RegisterSW;
