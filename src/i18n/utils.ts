/**
 * i18n utilities — translation lookup and locale helpers.
 *
 * Translations live in `./translations.json` as a nested object keyed by
 * locale (`en`, `es`, ...). `getTranslations(locale)` returns a flat
 * dot-notation record (`nav.learn`, `footer.copyright`, ...) so callers can
 * look up strings by a single key.
 *
 * Missing locales fall back to English. Missing keys within a non-English
 * locale also fall back to English rather than returning `undefined`, so
 * partially-translated pages still render correctly.
 */
import translationsJson from './translations.json';
import { withBase } from '@/lib/utils/url';

export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'es'] as const;

type TranslationTree = Record<string, unknown>;

/**
 * Flatten a nested object into dot-notation keys.
 *
 *   { a: { b: 'hi' } } -> { 'a.b': 'hi' }
 *
 * Arrays and non-string leaves are skipped — only string leaves become keys.
 */
function flatten(tree: TranslationTree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(tree)) {
    const value = tree[key];
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[nextKey] = value;
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flatten(value as TranslationTree, nextKey);
      for (const nestedKey of Object.keys(nested)) {
        const nestedValue = nested[nestedKey];
        if (typeof nestedValue === 'string') {
          out[nestedKey] = nestedValue;
        }
      }
    }
  }
  return out;
}

const english = flatten(translationsJson.en as TranslationTree);

const flattenedByLocale: Record<Locale, Record<string, string>> = {
  en: english,
  es: flatten(translationsJson.es as TranslationTree),
};

/**
 * Normalize a locale string to one of the supported locales.
 *
 * Accepts plain codes ("en", "es") and BCP-47 tags ("es-ES", "es-MX"). Returns
 * the default locale for anything unsupported.
 */
export function normalizeLocale(input: string | undefined | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return 'en';
  if (lower === 'es' || lower.startsWith('es-')) return 'es';
  return DEFAULT_LOCALE;
}

/**
 * Look up a translation by dot-notation key for the given locale.
 *
 * Falls back to English if the key is not present in the requested locale.
 * Returns the key itself when the key is missing in both locales — this keeps
 * partial translations visible during development without crashing the page.
 */
export function translate(locale: string, key: string): string {
  const safeLocale = normalizeLocale(locale);
  const direct = flattenedByLocale[safeLocale][key];
  if (typeof direct === 'string') return direct;
  const fallback = english[key];
  if (typeof fallback === 'string') return fallback;
  return key;
}

/**
 * Return all translations for the given locale as a flat
 * dot-notation record. Missing keys are filled in from the English record so
 * every supported locale always returns a complete superset of English.
 *
 * @example
 *   const t = getTranslations('es');
 *   t['nav.learn']; // 'Aprende'
 *   t['nav.unknown']; // English value or key if missing in both
 */
export function getTranslations(locale: string): Record<string, string> {
  const safeLocale = normalizeLocale(locale);
  const primary = flattenedByLocale[safeLocale];
  const merged: Record<string, string> = { ...english };
  for (const key of Object.keys(primary)) {
    const value = primary[key];
    if (typeof value === 'string') {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Build the alternate URL for a given path under a different locale.
 *
 * `stripLocalePrefix` removes the leading locale segment (e.g. `/es`) if
 * present, so the result is always a locale-neutral path that can be
 * re-prefixed for the target locale.
 */
function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/');
  // pathname always starts with '' (from leading '/'), so segments[1] is the
  // first real segment.
  if (segments.length >= 2 && SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname || '/';
}

/**
 * Given a current pathname and a target locale, return the localized URL
 * the language switcher should link to.
 *
 *   buildAlternatePath('/graph', 'es')    // '/es/graph'
 *   buildAlternatePath('/es/graph', 'en') // '/graph'
 *   buildAlternatePath('/', 'es')         // '/es'
 *   buildAlternatePath('/es/', 'en')      // '/'
 */
export function buildAlternatePath(pathname: string, target: Locale): string {
  const stripped = stripLocalePrefix(pathname);
  if (target === DEFAULT_LOCALE) {
    return stripped === '' ? '/' : stripped;
  }
  return stripped === '/' ? `/${target}` : `/${target}${stripped}`;
}

/**
 * Build the canonical hreflang URLs for the current pathname in all
 * supported locales plus the `x-default` fallback.
 *
 * `pathname` must be locale-neutral *and* deploy-subpath-neutral (i.e. what
 * `stripBase(Astro.url.pathname)` returns) — this function re-applies the
 * deploy subpath itself via `withBase` so the site keeps working whether
 * it's hosted at the domain root or under a GitHub Pages project subpath.
 */
export function buildHreflangs(
  pathname: string,
  baseUrl: URL | string,
): {
  canonicalEn: string;
  canonicalEs: string;
  canonicalDefault: string;
} {
  // When a URL object is provided, use only the origin so any path on the
  // base URL does not leak into the canonical paths.
  const base =
    typeof baseUrl === 'string'
      ? baseUrl.replace(/\/$/, '')
      : `${baseUrl.protocol}//${baseUrl.host}`;
  const canonicalEn = `${base}${withBase(stripLocalePrefix(pathname))}`;
  const canonicalEs = `${base}${withBase(buildAlternatePath(pathname, 'es'))}`;
  return {
    canonicalEn,
    canonicalEs,
    canonicalDefault: canonicalEn,
  };
}
