import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
}));
