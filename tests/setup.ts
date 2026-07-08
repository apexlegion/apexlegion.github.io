/**
 * Vitest setup — runs before every test file.
 *
 * jsdom provides a browser-like environment for React component tests.
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
