import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  as?: 'div' | 'article' | 'section' | 'a';
  href?: string;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { variant = 'default', as = 'div', href, className, children, ...rest },
  ref,
) {
  const Component = href ? 'a' : as;
  const interactive = variant === 'interactive' || Boolean(href);

  return (
    <Component
      ref={ref as never}
      href={href}
      className={cn(
        'bg-surface-card text-text block rounded-xl border',
        variant === 'elevated' ? 'border-border-strong shadow-lg' : 'border-border shadow-sm',
        interactive &&
          'duration-base hover:border-border-strong focus-visible:ring-primary-orange focus-visible:ring-offset-surface transition-all ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('px-6 pt-6 pb-3', className)} {...rest}>
      {children}
    </div>
  );
});

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('text-text-muted px-6 py-3', className)} {...rest}>
      {children}
    </div>
  );
});

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border mt-3 flex items-center justify-end gap-2 border-t px-6 pt-3 pb-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
