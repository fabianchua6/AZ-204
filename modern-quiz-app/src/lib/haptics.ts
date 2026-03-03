'use client';

/**
 * Haptic feedback utility for mobile devices.
 *
 * Android/Chrome: uses the Vibration API (navigator.vibrate).
 * iOS Safari:     uses the hidden-label click trick — clicking a <label>
 *                 associated with a checkbox triggers the native
 *                 UISelectionFeedbackGenerator tap on iOS, bypassing the
 *                 Vibration API restriction.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

// Vibration patterns for Android (milliseconds: vibrate, pause, vibrate, …)
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],    // short pause then confirmation
  error: [50, 30, 50, 30, 50], // triple buzz
  warning: [30, 50, 30],    // double tap
  selection: 15,             // quick tap
};

// iOS click schedules: absolute ms offsets from t=0, one click per pulse.
// Mirrors the feel of HAPTIC_PATTERNS for the label-click iOS fallback.
const IOS_SCHEDULES: Record<HapticPattern, number[]> = {
  light:     [0],           // 1 click
  selection: [0],           // 1 click
  medium:    [0, 60],       // 2 clicks
  heavy:     [0, 55, 110],  // 3 clicks
  success:   [0, 60, 140],  // vibrate(10), pause(50), vibrate(30) → clicks at 0, 60, 140
  warning:   [0, 80],       // vibrate(30), pause(50), vibrate(30) → clicks at 0, 80
  error:     [0, 80, 160],  // vibrate(50), pause(30), vibrate(50)… → clicks at 0, 80, 160
};

// ─── iOS label-click setup ───────────────────────────────────────────────────

let _iosLabel: HTMLLabelElement | null = null;
const _iosTimeouts: ReturnType<typeof setTimeout>[] = [];

function getIosLabel(): HTMLLabelElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (_iosLabel) return _iosLabel;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = '__haptic_ios_cb__';
  const hiddenStyle = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;opacity:0;pointer-events:none;';
  checkbox.style.cssText = hiddenStyle;
  checkbox.setAttribute('aria-hidden', 'true');
  checkbox.tabIndex = -1;

  const label = document.createElement('label');
  label.htmlFor = '__haptic_ios_cb__';
  label.style.cssText = hiddenStyle;
  label.setAttribute('aria-hidden', 'true');

  document.body.appendChild(checkbox);
  document.body.appendChild(label);
  _iosLabel = label;
  return label;
}

// ─── Detection ───────────────────────────────────────────────────────────────

function hasVibrationAPI(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Covers iPhone/iPod and iPads on iOS 12 and below
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports as "Macintosh" — detect via touch points
  return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return hasVibrationAPI() || isIOS();
}

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined') return;

  // Android / Vibration API path
  if (hasVibrationAPI()) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch {
      // Silently fail
    }
    return;
  }

  // iOS label-click fallback
  if (isIOS()) {
    const label = getIosLabel();
    if (!label) return;

    // Clear any pending pattern clicks from a previous rapid call
    _iosTimeouts.splice(0).forEach(id => clearTimeout(id));

    const schedule = IOS_SCHEDULES[pattern];
    schedule.forEach(delay => {
      if (delay === 0) {
        try { label.click(); } catch { /* silently fail */ }
      } else {
        const id = setTimeout(() => {
          try { label.click(); } catch { /* silently fail */ }
        }, delay);
        _iosTimeouts.push(id);
      }
    });
  }
}

export function cancelHaptic(): void {
  // Cancel pending iOS pattern clicks
  _iosTimeouts.splice(0).forEach(id => clearTimeout(id));

  if (!hasVibrationAPI()) return;
  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

export function useHaptic() {
  return {
    trigger: triggerHaptic,
    cancel: cancelHaptic,
    isSupported: isHapticSupported(),
  };
}
