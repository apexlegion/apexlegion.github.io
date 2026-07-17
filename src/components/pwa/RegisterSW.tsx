import { useEffect } from 'react';
import { withBase } from '../../lib/utils/url';

/**
 * Registers `/sw.js` as the page's service worker.
 *
 * - No-ops gracefully when `navigator.serviceWorker` is unavailable (e.g. SSR,
 *   older browsers, disabled in settings).
 * - Scope must exactly match the deploy subpath: browsers reject a scope
 *   wider than the script's own directory unless the server sends a
 *   `Service-Worker-Allowed` header, which GitHub Pages does not support.
 * - Renders nothing.
 */
export interface RegisterSWProps {
  /** Override the script URL. Defaults to `/sw.js` under the deploy subpath. */
  scriptUrl?: string;
}

export function RegisterSW({ scriptUrl = withBase('/sw.js') }: RegisterSWProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Avoid registering during HMR if the module re-runs.
    const register = async () => {
      try {
        await navigator.serviceWorker.register(scriptUrl, { scope: withBase('/') });
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
