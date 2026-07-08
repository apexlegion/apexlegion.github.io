import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib';

export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Tag = forwardRef<HTMLButtonElement, TagProps>(function Tag(
  { active = false, className, children, type = 'button', disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'text-small inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium',
        'duration-fast transition-colors ease-out',
        'focus-visible:ring-primary-orange focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'bg-primary-orange text-text-inverse border-primary-orange'
          : 'bg-surface-elevated text-text-muted border-border hover:border-border-strong hover:text-text',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
