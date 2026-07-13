import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Highlight the tag (e.g. a shared attribute in a comparison). */
  active?: boolean;
  /** Visually de-emphasise (kept for API compatibility; non-interactive). */
  disabled?: boolean;
}

/**
 * Tag — a small, non-interactive label (category, level, modality, etc.).
 *
 * Renders a <span> on purpose: tags are almost always placed inside linked
 * cards, and a <button> nested in an <a> is invalid HTML that intercepts the
 * click so the card never navigates. Keeping tags as spans lets the whole
 * card stay a single, reliable click target.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { active = false, disabled = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      data-active={active || undefined}
      className={cn(
        'text-small inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium',
        active
          ? 'bg-primary-orange text-text-inverse border-primary-orange'
          : 'bg-surface-elevated text-text-muted border-border',
        disabled && 'opacity-60',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});
