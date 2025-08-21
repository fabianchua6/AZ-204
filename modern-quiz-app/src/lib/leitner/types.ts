// Leitner System Type Definitions
// Centralized type definitions for the Leitner spaced repetition system

import type { Question } from '@/types/quiz';

// Core Leitner data structures
export interface LeitnerProgress {
  questionId: string;
  currentBox: number; // 1-3 (3-box system)
  nextReviewDate: string; // ISO date string
  timesCorrect: number;
  timesIncorrect: number;
  lastReviewed: string; // ISO date string
  lastAnswerCorrect: boolean;
}

export interface LeitnerStats {
  totalQuestions: number;
  questionsStarted: number; // Questions that have been attempted at least once
  boxDistribution: Record<number, number>; // box -> count
  dueToday: number; // Questions remaining for daily target
  accuracyRate: number; // Overall accuracy rate (0-1)
  streakDays: number; // Consecutive days of activity
}

export interface QuestionWithLeitner extends Question {
  priority: number;
  isDue: boolean;
  currentBox: number;
  timesIncorrect?: number;
}

// Settings and configuration
export interface LeitnerSettings {
  dailyTarget: number; // Questions per day goal
}

// Method return types
export interface LeitnerAnswerResult {
  correct: boolean;
  movedFromBox: number;
  movedToBox: number;
  nextReview: string;
}

export interface DailyProgress {
  target: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export interface TimezoneDebugInfo {
  currentTime: string;
  localDate: string;
  utcDate: string;
  timezoneOffset: number;
  testDueComparison: boolean;
  streakTest: {
    currentStreak: number;
    todayHasActivity: boolean;
    sampleStoredDate: string;
    sampleConvertedDate: string;
  };
  edgeCaseTests: {
    midnightTransition: boolean;
    dstHandling: boolean;
    leapYearHandling: boolean;
  };
}

// Enhanced completion progress interface
export interface CompletionProgress {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
}
