import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantClasses = {
  text: 'rounded-md',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
} as const;

function toSize(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = 'text', width, height, lines, className, style, ...rest },
  ref,
) {
  const computedStyle = {
    ...style,
    width: toSize(width),
    height: toSize(height),
  };

  if (lines && lines > 1) {
    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)} aria-hidden="true" {...rest}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn('skeleton-shimmer', variantClasses[variant])}
            style={{
              width: index === lines - 1 ? '70%' : '100%',
              height: toSize(height) ?? '0.75rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn('skeleton-shimmer', variantClasses[variant], className)}
      style={computedStyle}
      aria-hidden="true"
      {...rest}
    />
  );
});
