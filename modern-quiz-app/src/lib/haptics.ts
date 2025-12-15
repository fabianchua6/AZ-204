'use client';

/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API with fallback to no-op for unsupported devices
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30], // Short pause, then confirmation
  error: [50, 30, 50, 30, 50], // Triple buzz for error
  warning: [30, 50, 30], // Double tap
  selection: 15, // Quick tap for option selection
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param pattern - The type of haptic feedback to trigger
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;
  
  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {
    // Silently fail if vibration is not allowed
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  return {
    trigger: triggerHaptic,
    cancel: cancelHaptic,
    isSupported: isHapticSupported(),
  };
}
