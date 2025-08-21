// Leitner System Module Index
// Central export point for all Leitner system components

// Main system class and singleton
export { LeitnerSystem, leitnerSystem } from '../leitner';

// Type definitions
export type {
  LeitnerProgress,
  LeitnerStats,
  QuestionWithLeitner,
  LeitnerSettings,
  LeitnerAnswerResult,
  DailyProgress,
  TimezoneDebugInfo,
  CompletionProgress,
} from './types';

// Constants and configuration
export {
  LEITNER_CONFIG,
  BOX_LABELS,
  BOX_COLORS,
  type BoxNumber,
  type BoxLabel,
  type BoxColor,
} from './constants';

// Utility classes
export {
  DateUtils,
  ValidationUtils,
  AlgorithmUtils,
  StorageUtils,
} from './utils';

// Backward compatibility re-exports (will be deprecated)
export { BOX_LABELS as BOX_LABELS_LEGACY } from './constants';
