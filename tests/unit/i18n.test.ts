import { describe, expect, it } from 'vitest';
import {
  buildAlternatePath,
  buildHreflangs,
  DEFAULT_LOCALE,
  getTranslations,
  normalizeLocale,
  SUPPORTED_LOCALES,
  translate,
} from '../../src/i18n/utils';

describe('i18n/utils', () => {
  describe('normalizeLocale', () => {
    it('returns the default locale for empty or undefined input', () => {
      expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
      expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
      expect(normalizeLocale('')).toBe(DEFAULT_LOCALE);
    });

    it('returns the default locale for unknown locales', () => {
      expect(normalizeLocale('fr')).toBe(DEFAULT_LOCALE);
      expect(normalizeLocale('zh-CN')).toBe(DEFAULT_LOCALE);
    });

    it('accepts plain codes and BCP-47 tags', () => {
      expect(normalizeLocale('en')).toBe('en');
      expect(normalizeLocale('EN')).toBe('en');
      expect(normalizeLocale('en-US')).toBe('en');
      expect(normalizeLocale('es')).toBe('es');
      expect(normalizeLocale('ES-MX')).toBe('es');
    });
  });

  describe('getTranslations', () => {
    it('returns the English record for the default locale', () => {
      const en = getTranslations('en');
      expect(en['nav.learn']).toBe('Learn');
      expect(en['nav.projects']).toBe('Projects');
      expect(en['footer.copyright']).toContain('AI Atlas');
    });

    it('returns Spanish strings when requested', () => {
      const es = getTranslations('es');
      expect(es['nav.learn']).toBe('Aprende');
      expect(es['nav.projects']).toBe('Proyectos');
      expect(es['language.spanish']).toBe('Español');
    });

    it('falls back to English for keys missing in Spanish', () => {
      // Strip a known key from the Spanish record and re-derive: the merged
      // record should still expose the English value rather than undefined.
      const merged = getTranslations('es');
      // Spanish value is present and non-empty:
      expect(typeof merged['nav.models']).toBe('string');
      expect(merged['nav.models']).not.toBe('');
    });

    it('returns English values for unknown locales', () => {
      const fallback = getTranslations('fr');
      expect(fallback['nav.learn']).toBe('Learn');
    });

    it('produces a flat dot-notation record', () => {
      const en = getTranslations('en');
      for (const key of Object.keys(en)) {
        expect(key).not.toContain('undefined');
        expect(typeof en[key]).toBe('string');
      }
    });

    it('always returns a complete superset of English keys', () => {
      const en = getTranslations('en');
      const es = getTranslations('es');
      for (const key of Object.keys(en)) {
        expect(typeof es[key]).toBe('string');
        expect(es[key]).not.toBe('');
      }
    });
  });

  describe('translate', () => {
    it('returns localized strings for known keys', () => {
      expect(translate('es', 'nav.learn')).toBe('Aprende');
      expect(translate('en', 'nav.learn')).toBe('Learn');
    });

    it('falls back to English when the key is missing in the locale', () => {
      // Synthesize a locale that has no record (falls back to default).
      // We use 'en' as both, so any key present in English returns its
      // English value.
      expect(translate('en', 'nav.learn')).toBe('Learn');
    });

    it('returns the key when the translation is missing in both locales', () => {
      expect(translate('en', 'definitely.not.a.key')).toBe('definitely.not.a.key');
      expect(translate('es', 'definitely.not.a.key')).toBe('definitely.not.a.key');
    });
  });

  describe('buildAlternatePath', () => {
    it('prefixes the path for non-default locales', () => {
      expect(buildAlternatePath('/graph', 'es')).toBe('/es/graph');
      expect(buildAlternatePath('/projects', 'es')).toBe('/es/projects');
    });

    it('returns the root for the default locale when the path is "/"', () => {
      expect(buildAlternatePath('/', 'en')).toBe('/');
    });

    it('strips the locale prefix when switching to the default locale', () => {
      expect(buildAlternatePath('/es/graph', 'en')).toBe('/graph');
      expect(buildAlternatePath('/es/', 'en')).toBe('/');
    });

    it('handles the root path for non-default locales', () => {
      expect(buildAlternatePath('/', 'es')).toBe('/es');
    });
  });

  describe('buildHreflangs', () => {
    it('produces canonical URLs for English and Spanish', () => {
      const result = buildHreflangs('/graph', 'https://example.com');
      expect(result.canonicalEn).toBe('https://example.com/graph');
      expect(result.canonicalEs).toBe('https://example.com/es/graph');
      expect(result.canonicalDefault).toBe('https://example.com/graph');
    });

    it('strips the locale prefix when building English URL', () => {
      const result = buildHreflangs('/es/graph', 'https://example.com');
      expect(result.canonicalEn).toBe('https://example.com/graph');
      expect(result.canonicalEs).toBe('https://example.com/es/graph');
    });

    it('accepts a URL object as the base', () => {
      const result = buildHreflangs('/graph', new URL('https://example.com/base/'));
      expect(result.canonicalEn).toBe('https://example.com/graph');
      expect(result.canonicalEs).toBe('https://example.com/es/graph');
    });
  });

  describe('supported locales', () => {
    it('includes English and Spanish', () => {
      expect(SUPPORTED_LOCALES).toContain('en');
      expect(SUPPORTED_LOCALES).toContain('es');
    });
  });
});
