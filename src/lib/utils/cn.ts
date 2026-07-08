/**
 * Compose Tailwind class names safely.
 *
 * Accepts strings, arrays, and conditional objects. Falsy values are dropped.
 * Keeps the result free of duplicate whitespace.
 *
 * @example
 *   cn('base', isActive && 'active', { 'is-disabled': disabled });
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const push = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) push(v);
      return;
    }
    if (typeof value === 'object') {
      for (const [key, condition] of Object.entries(value)) {
        if (condition) out.push(key);
      }
    }
  };

  for (const input of inputs) push(input);
  return out.join(' ').replace(/\s+/g, ' ').trim();
}
