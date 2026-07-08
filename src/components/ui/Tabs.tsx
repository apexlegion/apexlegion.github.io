import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  ariaLabel: string;
  className?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ items, defaultActiveId, ariaLabel, className, onChange }: TabsProps) {
  const reactId = useId();
  const baseId = `tabs-${reactId}`;
  const firstAvailable = items.find((item) => !item.disabled);
  const initial = defaultActiveId ?? firstAvailable?.id;
  const [activeId, setActiveId] = useState<string | undefined>(initial);

  const handleSelect = (id: string): void => {
    setActiveId(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    for (let step = 1; step <= items.length; step += 1) {
      const nextIndex = (index + direction * step + items.length) % items.length;
      const candidate = items[nextIndex];
      if (candidate && !candidate.disabled) {
        setActiveId(candidate.id);
        onChange?.(candidate.id);
        const button = document.getElementById(`${baseId}-tab-${candidate.id}`);
        button?.focus();
        return;
      }
    }
  };

  const active = items.find((item) => item.id === activeId);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="border-border flex flex-wrap gap-1 border-b"
      >
        {items.map((item, index) => {
          const isSelected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => handleSelect(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                'text-small duration-fast relative -mb-px px-4 py-2.5 font-medium transition-colors ease-out',
                'focus-visible:ring-primary-orange focus-visible:ring-offset-surface rounded-t-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isSelected
                  ? 'text-primary-orange border-primary-orange border-b-2'
                  : 'text-text-muted hover:text-text border-b-2 border-transparent',
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="focus-visible:outline-none"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
