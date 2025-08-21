// Leitner System Implementation for Quiz App
// Uses localStorage for persistence

import type { Question } from '@/types/quiz';

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
  dueToday: number;
  accuracyRate: number;
  streakDays: number;
}

export interface QuestionWithLeitner extends Question {
  priority: number;
  isDue: boolean;
  currentBox: number;
  timesIncorrect?: number;
}

// Leitner box intervals in days (3-box system for short study periods)
const LEITNER_INTERVALS = {
  1: 1, // Box 1: 1 day (new/difficult)
  2: 2, // Box 2: 2 days (improving)
  3: 3, // Box 3: 3 days (mastered)
} as const;

const STORAGE_KEY = 'leitner-progress';
const STATS_KEY = 'leitner-stats';

export class LeitnerSystem {
  private progress: Map<string, LeitnerProgress> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private questionSeed: number = Date.now(); // Stable seed for sorting

  constructor() {
    this.initializeAsync();
  }

  // Async initialization to handle localStorage safely
  private async initializeAsync(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise; // Prevent multiple initializations
    }

    this.initializationPromise = (async () => {
      if (typeof window === 'undefined') return; // SSR safety

      try {
        await this.loadFromStorage();
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize Leitner system:', error);
        this.initialized = true; // Continue with empty state
      }
    })();

    return this.initializationPromise;
  }

  // Ensure system is initialized before operations
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeAsync();
    }
  }

  // Enhanced localStorage operations with validation
  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      if (!this.validateStoredData(data)) {
        console.warn('Invalid stored data, resetting Leitner progress');
        return;
      }

      this.progress = new Map(Object.entries(data));
      
      // Migrate existing 5-box data to 3-box system
      this.migrateToThreeBoxSystem();
    } catch (error) {
      console.error('Failed to load Leitner progress:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Migrate existing 5-box system data to 3-box system
  private migrateToThreeBoxSystem(): void {
    let migrationMade = false;
    
    this.progress.forEach((progress) => {
      if (progress.currentBox > 3) {
        // Move boxes 4 and 5 to box 3 (mastered)
        progress.currentBox = 3;
        
        // Recalculate next review date for box 3
        const lastReviewed = new Date(progress.lastReviewed);
        progress.nextReviewDate = this.calculateNextReviewDate(3, lastReviewed).toISOString();
        
        migrationMade = true;
      }
    });
    
    if (migrationMade) {
      console.log('Migrated Leitner data from 5-box to 3-box system');
      this.saveToStorage();
    }
  }

  // Validate stored data structure
  private validateStoredData(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>
    )) {
      if (typeof key !== 'string' || !this.validateProgress(value)) {
        return false;
      }
    }
    return true;
  }

  // Validate individual progress record
  private validateProgress(progress: unknown): boolean {
    if (!progress || typeof progress !== 'object') return false;

    const p = progress as Record<string, unknown>;
    return (
      typeof p.questionId === 'string' &&
      typeof p.currentBox === 'number' &&
      p.currentBox >= 1 &&
      p.currentBox <= 3 &&
      typeof p.nextReviewDate === 'string' &&
      typeof p.timesCorrect === 'number' &&
      typeof p.timesIncorrect === 'number'
    );
  }

  // Enhanced save with debouncing and error recovery
  private saveToStorage(): void {
    if (typeof window === 'undefined') return; // SSR safety

    // Debounce saves to prevent excessive localStorage writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.performSave();
    }, 100); // 100ms debounce
  }

  private performSave(): void {
    try {
      const data = Object.fromEntries(this.progress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded - cleanup old data
        this.cleanupOldData();
        try {
          const data = Object.fromEntries(this.progress);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      } else {
        console.error('Failed to save Leitner progress:', error);
      }
    }
  }

  // Cleanup old progress data to free storage
  private cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const keysToDelete: string[] = [];
    this.progress.forEach((progress, questionId) => {
      if (progress.lastReviewed < cutoffDate && progress.currentBox === 3) {
        // Remove old mastered questions that haven't been reviewed recently
        keysToDelete.push(questionId);
      }
    });

    keysToDelete.forEach(key => this.progress.delete(key));
  }

  // Initialize a new question in Box 1
  private initializeQuestion(questionId: string): LeitnerProgress {
    const now = new Date();
    const progress: LeitnerProgress = {
      questionId,
      currentBox: 1,
      nextReviewDate: this.calculateNextReviewDate(1, now).toISOString(),
      timesCorrect: 0,
      timesIncorrect: 0,
      lastReviewed: now.toISOString(),
      lastAnswerCorrect: false,
    };

    this.progress.set(questionId, progress);
    this.saveToStorage();
    return progress;
  }

  // Calculate next review date based on box and current date (optimized)
  private calculateNextReviewDate(box: number, fromDate: Date): Date {
    const interval = LEITNER_INTERVALS[box as keyof typeof LEITNER_INTERVALS];
    const nextDate = new Date(
      fromDate.getTime() + interval * 24 * 60 * 60 * 1000
    );
    return nextDate;
  }

  // Optimized date comparison helper
  private isDateDue(reviewDateStr: string, currentDate: Date): boolean {
    return (
      reviewDateStr.split('T')[0] <= currentDate.toISOString().split('T')[0]
    );
  }

  // Stable pseudo-random function for consistent sorting
  private stableRandom(questionId: string): number {
    // Simple hash function for consistent randomization per question
    let hash = 0;
    const combined = questionId + this.questionSeed;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }
  private moveQuestion(currentBox: number, wasCorrect: boolean): number {
    if (currentBox < 1 || currentBox > 3) {
      console.warn(`Invalid current box: ${currentBox}, defaulting to 1`);
      return 1;
    }

    if (wasCorrect) {
      return Math.min(currentBox + 1, 3); // Move up, max Box 3
    } else {
      return 1; // Reset to Box 1 for incorrect answers
    }
  }

  // Process user's answer using Leitner algorithm (async for better performance)
  async processAnswer(
    questionId: string,
    wasCorrect: boolean
  ): Promise<{
    correct: boolean;
    movedFromBox: number;
    movedToBox: number;
    nextReview: string;
  }> {
    await this.ensureInitialized();

    if (!questionId || typeof wasCorrect !== 'boolean') {
      throw new Error('Invalid parameters for processAnswer');
    }

    let progress = this.progress.get(questionId);

    // Initialize if question hasn't been seen before
    if (!progress) {
      progress = this.initializeQuestion(questionId);
    }

    const currentBox = progress.currentBox;
    const newBox = this.moveQuestion(currentBox, wasCorrect);
    const now = new Date();
    const nextReview = this.calculateNextReviewDate(newBox, now);

    // Update progress with optimized object creation
    const updatedProgress: LeitnerProgress = {
      questionId: progress.questionId,
      currentBox: newBox,
      nextReviewDate: nextReview.toISOString(),
      timesCorrect: progress.timesCorrect + (wasCorrect ? 1 : 0),
      timesIncorrect: progress.timesIncorrect + (wasCorrect ? 0 : 1),
      lastReviewed: now.toISOString(),
      lastAnswerCorrect: wasCorrect,
    };

    this.progress.set(questionId, updatedProgress);
    this.saveToStorage();

    return {
      correct: wasCorrect,
      movedFromBox: currentBox,
      movedToBox: newBox,
      nextReview: nextReview.toISOString(),
    };
  }

  // Get questions due for review with optimized sorting and interleaving
  async getDueQuestions(
    allQuestions: Question[]
  ): Promise<QuestionWithLeitner[]> {
    await this.ensureInitialized();

    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
      return [];
    }

    // Filter out code questions and questions with no select options
    const filteredQuestions = allQuestions.filter(question => {
      // Exclude questions with code examples
      if (question.hasCode) {
        return false;
      }
      // Exclude questions with no select options
      if (question.options.length === 0) {
        return false;
      }
      return true;
    });

    const currentDate = new Date();

    // Use map for O(1) lookups instead of repeated gets
    const questionsWithPriority: QuestionWithLeitner[] = filteredQuestions.map(
      question => {
        const progress = this.progress.get(question.id);

        if (!progress) {
          // New questions get highest priority (Box 1)
          return { ...question, priority: 1, isDue: true, currentBox: 1 };
        }

        const isDue = this.isDateDue(progress.nextReviewDate, currentDate);

        return {
          ...question,
          priority: progress.currentBox,
          isDue,
          currentBox: progress.currentBox,
          timesIncorrect: progress.timesIncorrect,
        };
      }
    );

    // Filter to only questions that are due or new, plus some review questions
    const dueAndNewQuestions = questionsWithPriority.filter(q => {
      // Include all due questions and new questions
      if (q.isDue) return true;

      // Include some questions from higher boxes for review (10% chance)
      if (q.currentBox >= 3 && Math.random() < 0.1) return true;

      return false;
    });

    // If we have too few due questions, add some from lower boxes
    if (dueAndNewQuestions.length < 20) {
      const additionalQuestions = questionsWithPriority
        .filter(q => !q.isDue && q.currentBox <= 3)
        .slice(0, 20 - dueAndNewQuestions.length);
      dueAndNewQuestions.push(...additionalQuestions);
    }

    // Optimized sorting with early returns
    const sortedQuestions = dueAndNewQuestions.sort((a, b) => {
      // Due questions first
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;

      // Then by box priority (lower boxes = higher priority)
      if (a.priority !== b.priority) return a.priority - b.priority;

      // Then by failure count (more failures = higher priority)
      const failureDiff = (b.timesIncorrect || 0) - (a.timesIncorrect || 0);
      if (failureDiff !== 0) return failureDiff;

      // For questions with same priority and failure count, use stable randomization
      const randomA = this.stableRandom(a.id);
      const randomB = this.stableRandom(b.id);
      return randomA - randomB;
    });

    // Apply optimized interleaving by topic for better learning
    return this.optimizedInterleaveByTopic(sortedQuestions);
  }

  // Optimized interleaving algorithm with better distribution
  private optimizedInterleaveByTopic(
    questions: QuestionWithLeitner[]
  ): QuestionWithLeitner[] {
    if (questions.length <= 2) return questions;

    // Group questions by topic efficiently
    const topicGroups = new Map<string, QuestionWithLeitner[]>();
    questions.forEach(q => {
      if (!topicGroups.has(q.topic)) {
        topicGroups.set(q.topic, []);
      }
      topicGroups.get(q.topic)!.push(q);
    });

    if (topicGroups.size === 1) return questions; // No interleaving needed

    const topics = Array.from(topicGroups.keys());
    const interleaved: QuestionWithLeitner[] = [];
    let topicIndex = 0;
    let roundCount = 0;

    // Improved distribution algorithm
    while (interleaved.length < questions.length) {
      const currentTopic = topics[topicIndex % topics.length];
      const topicQuestions = topicGroups.get(currentTopic);

      if (topicQuestions && topicQuestions.length > 0) {
        // Take questions from beginning to maintain priority order
        const question = topicQuestions.shift()!;
        interleaved.push(question);
      }

      topicIndex++;

      // Remove empty topic groups efficiently
      if (topicGroups.get(currentTopic)?.length === 0) {
        topicGroups.delete(currentTopic);
        const topicIdx = topics.indexOf(currentTopic);
        if (topicIdx > -1) {
          topics.splice(topicIdx, 1);
        }

        if (topics.length === 0) break;
        topicIndex = topicIndex % topics.length;
      }

      // Prevent infinite loops
      roundCount++;
      if (roundCount > questions.length * 2) {
        console.warn('Interleaving algorithm exceeded expected iterations');
        break;
      }
    }

    return interleaved;
  }

  // Get current statistics
  getStats(allQuestions: Question[]): LeitnerStats {
    // Note: Expect pre-filtered questions from QuestionService
    const boxDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let totalCorrect = 0;
    let totalAnswered = 0;
    let questionsStarted = 0; // Questions that have been attempted at least once

    const today = new Date().toISOString().split('T')[0];

    allQuestions.forEach(question => {
      const progress = this.progress.get(question.id);

      if (!progress) {
        // New questions are in Box 1
        boxDistribution[1]++;
      } else {
        boxDistribution[progress.currentBox]++;
        questionsStarted++; // This question has been started

        // Accumulate stats
        totalCorrect += progress.timesCorrect;
        totalAnswered += progress.timesCorrect + progress.timesIncorrect;
      }
    });

    // Calculate accuracy - show 0% if no questions answered yet
    const accuracyRate = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

    // Calculate streak (simplified - just check if user has been active)
    const streakDays = this.calculateStreakDays();

    // Start with 60, but subtract questions answered today to show progress
    const questionsAnsweredToday = Array.from(this.progress.values()).filter(
      progress => progress.lastReviewed.split('T')[0] === today
    ).length;

    const displayDueToday = Math.max(0, 60 - questionsAnsweredToday);

    return {
      totalQuestions: allQuestions.length, // Questions are pre-filtered upstream
      questionsStarted,
      boxDistribution,
      dueToday: displayDueToday,
      accuracyRate,
      streakDays,
    };
  }

  // Get progress for a specific question
  getQuestionProgress(questionId: string): LeitnerProgress | null {
    return this.progress.get(questionId) || null;
  }

  // Get completion progress for progress bars
  getCompletionProgress(allQuestions: Question[]): {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  } {
    // Note: Expect pre-filtered questions from QuestionService
    let answeredQuestions = 0;
    let correctAnswers = 0;
    let totalCorrect = 0;
    let totalAnswered = 0;

    allQuestions.forEach(question => {
      const progress = this.progress.get(question.id);
      if (progress) {
        answeredQuestions++;
        totalCorrect += progress.timesCorrect;
        totalAnswered += progress.timesCorrect + progress.timesIncorrect;

        // Consider a question "correct" if they got it right more often than wrong
        if (progress.timesCorrect > progress.timesIncorrect) {
          correctAnswers++;
        }
      }
    });

    const incorrectAnswers = answeredQuestions - correctAnswers;
    const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

    return {
      totalQuestions: allQuestions.length, // Pre-filtered upstream
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
    };
  }

  // Simple streak calculation based on recent activity
  private calculateStreakDays(): number {
    const today = new Date();
    let streak = 0;

    // Check last 30 days for activity
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasActivity = Array.from(this.progress.values()).some(
        progress => progress.lastReviewed.split('T')[0] === dateStr
      );

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        // Break streak if no activity (but don't count today if it's just starting)
        break;
      }
    }

    return streak;
  }

  // Clear all progress (for testing/reset)
  clearProgress(): void {
    this.progress.clear();
    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
    // Reset seed for new randomization
    this.questionSeed = Date.now();
  }
}

// Singleton instance
export const leitnerSystem = new LeitnerSystem();

export const BOX_LABELS = {
  1: 'Learning',
  2: 'Practicing',
  3: 'Improving',
  4: 'Confident',
  5: 'Mastered',
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
  4: {
    bg: 'hsl(var(--box4-bg))',
    fg: 'hsl(var(--box4-fg))',
    bgTransparent: 'hsl(var(--box4-bg-transparent))',
    bgClass: 'leitner-box-bg-4',
    fgClass: 'leitner-box-text-4',
    surfaceClass: 'leitner-box-surface-4',
    surfaceTransparentClass: 'leitner-box-surface-transparent-4',
    dotClass: 'leitner-box-dot-4',
    bgVariable: 'bg-[hsl(var(--box4-bg))]',
    fgVariable: 'text-[hsl(var(--box4-fg))]',
    bgTransparentVariable: 'bg-[hsl(var(--box4-bg-transparent))]',
  },
  5: {
    bg: 'hsl(var(--box5-bg))',
    fg: 'hsl(var(--box5-fg))',
    bgTransparent: 'hsl(var(--box5-bg-transparent))',
    bgClass: 'leitner-box-bg-5',
    fgClass: 'leitner-box-text-5',
    surfaceClass: 'leitner-box-surface-5',
    surfaceTransparentClass: 'leitner-box-surface-transparent-5',
    dotClass: 'leitner-box-dot-5',
    bgVariable: 'bg-[hsl(var(--box5-bg))]',
    fgVariable: 'text-[hsl(var(--box5-fg))]',
    bgTransparentVariable: 'bg-[hsl(var(--box5-bg-transparent))]',
  },
} as const;
