import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  it('concatenates string inputs', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', null, undefined, false, '', 0, 'b')).toBe('a b');
  });

  it('supports object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('supports nested arrays', () => {
    expect(cn('a', ['b', { c: true, d: false }, ['e']])).toBe('a b c e');
  });

  it('collapses whitespace', () => {
    expect(cn('a   b', '\nc\t')).toBe('a b c');
  });
});
