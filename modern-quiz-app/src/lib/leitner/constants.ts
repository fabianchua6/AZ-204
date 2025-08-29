// Leitner System Constants and Configuration
// Centralized configuration for the 3-box Leitner spaced repetition system

// Core system configuration
export const LEITNER_CONFIG = {
  // Box intervals in days (3-box system optimized for intensive study)
  INTERVALS: {
    1: 1, // Box 1: 1 day (new/difficult questions)
    2: 2, // Box 2: 2 days (improving questions)
    3: 3, // Box 3: 3 days (mastered questions)
  } as const,

  // Storage keys
  STORAGE: {
    PROGRESS: 'leitner-progress',
    STATS: 'leitner-stats', // Legacy key (unused but kept for compatibility)
    SETTINGS: 'leitner-settings',
  } as const,

  // System limits and thresholds
  LIMITS: {
    MAX_BOX: 3,
    MIN_BOX: 1,
    MIN_DAILY_TARGET: 1,
    MAX_DAILY_TARGET: 500,
    CLEANUP_THRESHOLD_DAYS: 30,
    MIN_DUE_QUESTIONS: 50, // Reduced from 100 for better performance
    MAX_NEW_QUESTIONS_PER_SESSION: 20, // NEW: Limit new questions per session
    REVIEW_PROBABILITY: 0.5, // Increased to 50% for more review questions
  } as const,

  // Performance settings
  PERFORMANCE: {
    SAVE_DEBOUNCE_MS: 100,
    MAX_INTERLEAVING_ITERATIONS: 1000, // Safety limit for topic interleaving
  } as const,

  // Default user settings
  DEFAULT_SETTINGS: {
    dailyTarget: 60, // Default to 60 questions per day
  } as const,
} as const;

// Box labels for UI display (3-box system)
export const BOX_LABELS = {
  1: 'Learning',
  2: 'Practicing', 
  3: 'Mastered',
} as const;

// Centralized box color system - bridges CSS variables with JavaScript API
// Single source of truth for all Leitner box colors across the app
export const BOX_COLORS = {
  1: {
    // CSS variable values (for inline styles)
    bg: 'hsl(var(--box1-bg))',
    fg: 'hsl(var(--box1-fg))',
    bgTransparent: 'hsl(var(--box1-bg-transparent))', // Transparent variant
    // Tailwind utility classes (preferred)
    bgClass: 'leitner-box-bg-1',
    fgClass: 'leitner-box-text-1', 
    surfaceClass: 'leitner-box-surface-1', // bg + text combined
    surfaceTransparentClass: 'leitner-box-surface-transparent-1', // transparent variant
    dotClass: 'leitner-box-dot-1',
    // For dynamic class names
    bgVariable: 'bg-[hsl(var(--box1-bg))]',
    fgVariable: 'text-[hsl(var(--box1-fg))]',
    bgTransparentVariable: 'bg-[hsl(var(--box1-bg-transparent))]',
  },
  2: {
    bg: 'hsl(var(--box2-bg))',
    fg: 'hsl(var(--box2-fg))',
    bgTransparent: 'hsl(var(--box2-bg-transparent))',
    bgClass: 'leitner-box-bg-2',
    fgClass: 'leitner-box-text-2',
    surfaceClass: 'leitner-box-surface-2',
    surfaceTransparentClass: 'leitner-box-surface-transparent-2',
    dotClass: 'leitner-box-dot-2',
    bgVariable: 'bg-[hsl(var(--box2-bg))]',
    fgVariable: 'text-[hsl(var(--box2-fg))]',
    bgTransparentVariable: 'bg-[hsl(var(--box2-bg-transparent))]',
  },
  3: {
    bg: 'hsl(var(--box3-bg))',
    fg: 'hsl(var(--box3-fg))',
    bgTransparent: 'hsl(var(--box3-bg-transparent))',
    bgClass: 'leitner-box-bg-3',
    fgClass: 'leitner-box-text-3',
    surfaceClass: 'leitner-box-surface-3',
    surfaceTransparentClass: 'leitner-box-surface-transparent-3',
    dotClass: 'leitner-box-dot-3',
    bgVariable: 'bg-[hsl(var(--box3-bg))]',
    fgVariable: 'text-[hsl(var(--box3-fg))]',
    bgTransparentVariable: 'bg-[hsl(var(--box3-bg-transparent))]',
  },
} as const;

// Type helpers for better type safety
export type BoxNumber = keyof typeof LEITNER_CONFIG.INTERVALS;
export type BoxLabel = typeof BOX_LABELS[BoxNumber];
export type BoxColor = typeof BOX_COLORS[BoxNumber];
