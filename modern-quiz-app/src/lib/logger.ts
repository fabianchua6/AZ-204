// Lightweight logger. Enable by setting NEXT_PUBLIC_DEBUG=true
export const debugEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === 'true';
// Accept unknown args to avoid eslint any rule
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debug(...args: any[]): void {
  if (debugEnabled) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
