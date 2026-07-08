import { useCallback, useEffect, useState } from 'react';

/**
 * Captured BeforeInstallPromptEvent shape. Not all browsers expose this on
 * `WindowEventMap`, so we declare the bits we use locally.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'ai-atlas:pwa-install-dismissed';
const SESSION_MARKER = 'ai-atlas:pwa-install-dismissed:session';

function wasDismissedThisSession(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_MARKER) === '1';
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_MARKER, '1');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  } catch {
    // Storage may be disabled (private mode). Fail quietly.
  }
}

export interface InstallPromptProps {
  /** Optional className for the banner container. */
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (wasDismissedThisSession()) return undefined;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // Browser rejected the prompt. Hide the banner anyway.
    } finally {
      setVisible(false);
      setEvent(null);
    }
  }, [event]);

  const handleDismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
  }, []);

  if (!visible || !event) return null;

  return (
    <div
      role="region"
      aria-label="Install AI Atlas"
      data-testid="pwa-install-prompt"
      className={
        'border-border bg-surface-elevated text-text fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-t-lg border p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4 ' +
        (className ?? '')
      }
    >
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-text font-semibold">Install AI Atlas</span>
        <span className="text-text-muted text-small">
          Add the Atlas to your home screen for quick, offline access.
        </span>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="border-border text-text-muted hover:text-text hover:bg-surface focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="bg-primary-orange text-surface hover:bg-primary-orange-hover focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Install
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
