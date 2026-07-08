/**
 * Barrel export for layout React components.
 *
 * Astro layout components (Container, Grid, Section, Header, Footer,
 * GlobalNav, Breadcrumbs) are not re-exported here because TypeScript
 * cannot resolve `.astro` modules through a `.ts` barrel. Import them
 * directly from their files, e.g.:
 *   import Container from '@/components/layout/Container.astro';
 */
export { MobileMenu } from './MobileMenu';
export { CommandPalette } from './CommandPalette';
export type { CommandPaletteProps, SearchIndexItem } from './CommandPalette';
