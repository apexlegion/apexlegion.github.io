/**
 * Barrel export for all shared components.
 *
 * Note: Astro layout components (Container, Grid, Section, Header, Footer,
 * GlobalNav, Breadcrumbs) are not re-exported here because TypeScript cannot
 * resolve `.astro` modules through a `.ts` barrel. Import them directly from
 * their files, e.g.:
 *   import Container from '@/components/layout/Container.astro';
 */
export * from './ui';
export { MobileMenu, type MobileMenuProps, type NavLink } from './layout/MobileMenu';
export {
  CommandPalette,
  type CommandPaletteProps,
  type SearchIndexItem,
} from './layout/CommandPalette';
export { ThemeToggle, type Theme } from './ui/ThemeToggle';
