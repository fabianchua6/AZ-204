'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { runStorageMigration } from '@/lib/storage-migration';

// Run one-time storage migration on first client-side render.
// Synchronous and gated by storage-schema-version — no-op after first run.
if (typeof window !== 'undefined') {
  runStorageMigration();
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
