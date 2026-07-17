import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/utils';
import { buildAlternatePath, normalizeLocale } from '../../i18n/utils';
import { stripBase, withBase } from '../../lib/utils/url';

export interface LanguageSwitcherProps {
  /**
   * Current locale as rendered by the server. Used as the SSR-safe default
   * before `window.location` is available on the client.
   */
  currentLocale: Locale;
  /**
   * Current pathname as rendered by the server. When omitted, the switcher
   * derives the path from `window.location.pathname` after mount, so links
   * automatically follow whatever page the visitor is on.
   */
  currentPath?: string;
  /**
   * Translations for the labels rendered inside the switcher (button text,
   * English/Spanish option names). Falls back to the English labels if a key
   * is missing, matching the behaviour of `getTranslations`.
   */
  labels?: {
    switcher?: string;
    english?: string;
    spanish?: string;
  };
}

const DEFAULT_LABELS = {
  switcher: 'Language',
  english: 'English',
  spanish: 'Español',
};

/**
 * LanguageSwitcher — React island rendered in the site header.
 *
 * Shows a button that reveals a small menu with links to the same page in
 * each supported locale. The English link is `/graph` when the visitor is on
 * `/es/graph`, and vice-versa.
 */
export function LanguageSwitcher({ currentLocale, currentPath, labels }: LanguageSwitcherProps) {
  const mergedLabels = {
    switcher: labels?.switcher ?? DEFAULT_LABELS.switcher,
    english: labels?.english ?? DEFAULT_LABELS.english,
    spanish: labels?.spanish ?? DEFAULT_LABELS.spanish,
  };

  // SSR-safe: derive the path on the client if not provided by the parent.
  // We render the fallback link (root) during the first paint, then upgrade
  // once `window.location` is available.
  const [resolvedPath, setResolvedPath] = useState<string>(
    currentPath ?? (currentLocale === 'es' ? '/es' : '/'),
  );

  useEffect(() => {
    if (currentPath !== undefined) return;
    if (typeof window === 'undefined') return;
    setResolvedPath(window.location.pathname || '/');
  }, [currentPath]);

  const detectedLocale = normalizeLocale(currentLocale);
  const localeNeutralPath = stripBase(resolvedPath);
  const englishHref = withBase(buildAlternatePath(localeNeutralPath, 'en'));
  const spanishHref = withBase(buildAlternatePath(localeNeutralPath, 'es'));

  return (
    <div
      className="relative inline-block"
      data-language-switcher
      data-current-locale={detectedLocale}
    >
      <details className="group">
        <summary
          className="text-text-muted hover:text-text border-border hover:border-border-strong bg-surface-elevated text-small focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-md border px-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
          aria-label={`${mergedLabels.switcher}: ${detectedLocale === 'es' ? mergedLabels.spanish : mergedLabels.english}`}
        >
          <span aria-hidden="true" className="text-base">
            ◐
          </span>
          <span className="hidden sm:inline">
            {detectedLocale === 'es' ? mergedLabels.spanish : mergedLabels.english}
          </span>
          <span aria-hidden="true" className="text-text-subtle text-xs">
            ▾
          </span>
        </summary>
        <div
          role="menu"
          aria-label={mergedLabels.switcher}
          className="border-border bg-surface-elevated absolute right-0 z-50 mt-2 min-w-[10rem] rounded-md border p-1 shadow-lg"
        >
          <a
            role="menuitem"
            href={englishHref}
            hrefLang="en"
            aria-current={detectedLocale === 'en' ? 'true' : undefined}
            className="text-text-muted hover:text-text hover:bg-surface aria-[current=true]:text-primary-orange flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors aria-[current=true]:font-semibold"
          >
            <span>{mergedLabels.english}</span>
            <span aria-hidden="true" className="text-text-subtle text-xs">
              EN
            </span>
          </a>
          <a
            role="menuitem"
            href={spanishHref}
            hrefLang="es"
            aria-current={detectedLocale === 'es' ? 'true' : undefined}
            className="text-text-muted hover:text-text hover:bg-surface aria-[current=true]:text-primary-orange flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors aria-[current=true]:font-semibold"
          >
            <span>{mergedLabels.spanish}</span>
            <span aria-hidden="true" className="text-text-subtle text-xs">
              ES
            </span>
          </a>
        </div>
      </details>
    </div>
  );
}

export default LanguageSwitcher;
