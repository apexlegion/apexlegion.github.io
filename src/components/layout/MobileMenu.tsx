import { useEffect, useState } from 'react';

export interface NavLink {
  label: string;
  href: string;
}

export interface MobileMenuProps {
  links: NavLink[];
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ links, open, onClose }: MobileMenuProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const t = window.setTimeout(() => setVisible(false), 200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className={`bg-surface duration-base fixed inset-0 z-50 transition-opacity ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <span className="text-h3 text-text font-bold">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="text-text-muted hover:text-text hover:bg-surface-elevated focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span aria-hidden="true" className="text-xl">
              ✕
            </span>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="border-border text-text hover:border-primary-orange hover:text-primary-orange block rounded-md border px-4 py-3 text-lg font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default MobileMenu;
