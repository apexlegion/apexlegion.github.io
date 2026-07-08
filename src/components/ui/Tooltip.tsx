import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const placementClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
} as const;

export function Tooltip({ content, children, placement = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const reactId = useId();
  const tooltipId = `tooltip-${reactId}`;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? tooltipId : undefined}>{children}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          'border-border bg-surface-elevated text-tiny text-text pointer-events-none absolute z-20 max-w-xs rounded-md border px-2.5 py-1.5 shadow-md',
          'duration-fast transition-opacity ease-out',
          open ? 'opacity-100' : 'opacity-0',
          placementClasses[placement],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
