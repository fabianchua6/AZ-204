// Animation and timing constants
export const ANIMATION_DURATIONS = {
  CARD_TRANSITION: 0.2,
  AUTO_ADVANCE_DELAY: 0,
  PROGRESS_ANIMATION: 0.4,
} as const;

// Animation easing curves
export const ANIMATION_EASINGS = {
  EASE_OUT_QUART: [0.23, 1, 0.32, 1],
  EASE_OUT_CUBIC: [0.25, 0.8, 0.25, 1],
} as const;

// UI spacing and sizing constants
export const UI_CONSTANTS = {
  BADGE_HEIGHT: 8,
  NAVIGATION_BUTTON_SIZE: 8,
  BOX_INDICATOR_SIZE: { width: 10, height: 8 },
  PROGRESS_BAR_HEIGHT: 1.5,
} as const;

// Quiz behavior constants
export const QUIZ_CONSTANTS = {
  DEFAULT_QUESTION_INDEX: 0,
  MINIMUM_DELAY_MS: 100,
} as const;
