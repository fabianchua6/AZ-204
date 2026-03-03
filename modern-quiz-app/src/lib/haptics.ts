'use client';

/**
 * Haptic feedback utility powered by the web-haptics library.
 * @see https://haptics.lochie.me/
 *
 * Handles both Android (Vibration API) and iOS Safari
 * (hidden-label click trick) internally via web-haptics.
 */

import { WebHaptics } from 'web-haptics';

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'error'
  | 'warning'
  | 'selection';

// Lazy-initialised singleton — avoids SSR DOM access in Next.js
let _instance: WebHaptics | null = null;

function getInstance(): WebHaptics | null {
  if (typeof window === 'undefined') return null;
  if (!_instance) {
    _instance = new WebHaptics();
  }
  return _instance;
}

export function isHapticSupported(): boolean {
  return WebHaptics.isSupported;
}

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  const instance = getInstance();
  if (!instance) return;
  instance.trigger(pattern);
}

export function cancelHaptic(): void {
  if (!_instance) return;
  _instance.cancel();
}

export function useHaptic() {
  return {
    trigger: triggerHaptic,
    cancel: cancelHaptic,
    isSupported: isHapticSupported(),
  };
}
