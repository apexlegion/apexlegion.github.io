import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '@/lib';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'muted';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /**
   * Render as a specific element. Defaults to `button`. Passing `href`
   * automatically renders an anchor so a Button can act as a real link
   * (navigates without JS — important for these statically-rendered pages).
   */
  as?: 'button' | 'a';
  href?: string;
}

export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-orange text-text-inverse hover:bg-primary-hover active:bg-primary-hover border border-primary-orange disabled:opacity-50',
  secondary:
    'bg-surface-elevated text-text hover:bg-surface-card border border-border hover:border-border-strong disabled:opacity-50',
  ghost:
    'bg-transparent text-text hover:bg-surface-elevated border border-transparent disabled:opacity-50',
  muted:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface border border-border disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-small gap-1.5 rounded-md',
  md: 'h-11 px-5 text-body gap-2 rounded-md',
  lg: 'h-12 px-6 text-body gap-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingLabel,
      fullWidth = false,
      disabled,
      className,
      children,
      iconLeft,
      iconRight,
      as,
      href,
      type,
      ...rest
    },
    ref,
  ) {
    const isDisabled = Boolean(disabled) || loading;
    const isLink = as === 'a' || (href !== undefined && as !== 'button');

    const classes = cn(
      'inline-flex items-center justify-center font-medium select-none cursor-pointer',
      'duration-fast transition-colors ease-out',
      'focus-visible:ring-primary-orange focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className,
    );

    const inner = loading ? (
      <>
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        <span>{loadingLabel ?? 'Loading'}</span>
      </>
    ) : (
      <>
        {iconLeft ? (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {iconLeft}
          </span>
        ) : null}
        <span>{children}</span>
        {iconRight ? (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {iconRight}
          </span>
        ) : null}
      </>
    );

    if (isLink) {
      // Render a real anchor so the button navigates without JS. When disabled,
      // drop the href and mark it so it is inert and announced correctly.
      const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={isDisabled ? undefined : href}
          aria-disabled={isDisabled || undefined}
          className={classes}
          {...anchorProps}
        >
          {inner}
        </a>
      );
    }

    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        className={classes}
        {...buttonProps}
      >
        {inner}
      </button>
    );
  },
);
