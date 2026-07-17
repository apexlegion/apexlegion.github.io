/**
 * AI Atlas is deployed as a GitHub Pages project page under a subpath (e.g.
 * `/aiatlas`), so any internal link written as a literal root-absolute
 * string (`href="/learn"`) resolves to the wrong URL in production. Astro's
 * `base` config only rewrites routes/assets it generates itself — it does
 * not rewrite string literals in templates or JSON data — so those need to
 * go through this helper instead.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Inverse of `withBase` — strips the deploy subpath so locale/route logic
 * that assumes root-relative paths (e.g. `stripLocalePrefix`) keeps working
 * regardless of where the site is hosted. */
export function stripBase(path: string): string {
  if (!BASE || !path.startsWith(BASE)) return path;
  const rest = path.slice(BASE.length);
  if (rest === '') return '/';
  return rest.startsWith('/') ? rest : `/${rest}`;
}
