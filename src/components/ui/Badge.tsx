import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib';

export type BadgeVariant =
  | 'project'
  | 'model'
  | 'concept'
  | 'tutorial'
  | 'video'
  | 'license'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  project: 'bg-primary-orange/15 text-primary-orange border-primary-orange/30',
  model: 'bg-info/15 text-info border-info/30',
  concept: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
  tutorial: 'bg-success/15 text-success border-success/30',
  video: 'bg-danger/15 text-danger border-danger/30',
  license: 'bg-warning/15 text-warning border-warning/30',
  neutral: 'bg-surface-elevated text-text-muted border-border',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  info: 'bg-info/15 text-info border-info/30',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'neutral', icon, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'text-tiny inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium tracking-wide uppercase',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
});
