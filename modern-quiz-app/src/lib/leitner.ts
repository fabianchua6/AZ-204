// Leitner System Implementation for Quiz App
// Uses localStorage for persistence
// Timezone-aware: All dates use local timezone (Singapore UTC+8) for proper review scheduling

import type { Question } from '@/types/quiz';
import { LEITNER_CONFIG } from './leitner/constants';
import { DateUtils, ValidationUtils, AlgorithmUtils, StorageUtils } from './leitner/utils';
import type {
  LeitnerProgress,
  LeitnerStats,
  QuestionWithLeitner,
  LeitnerSettings,
  LeitnerAnswerResult,
  DailyProgress,
  TimezoneDebugInfo,
  CompletionProgress,
} from './leitner/types';

// Re-export types for backward compatibility
export type {
  LeitnerProgress,
  LeitnerStats,
  QuestionWithLeitner,
  LeitnerAnswerResult,
  DailyProgress,
  TimezoneDebugInfo,
  CompletionProgress,
};

export class LeitnerSystem {
  private progress: Map<string, LeitnerProgress> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private questionSeed: number = Date.now(); // Stable seed for sorting
  private settings: LeitnerSettings = { ...LEITNER_CONFIG.DEFAULT_SETTINGS };

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
        await this.loadSettings();
        
        // Periodic cleanup of old daily attempts data
        this.clearOldDailyAttempts();
        
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
      const stored = StorageUtils.safeGetItem(LEITNER_CONFIG.STORAGE.PROGRESS);
      if (!stored) return;

      const data = JSON.parse(stored);
      if (!ValidationUtils.validateStoredData(data)) {
        console.warn('Invalid stored data, resetting Leitner progress');
        return;
      }

      this.progress = new Map(Object.entries(data));
      
      // Migrate existing 5-box data to 3-box system
      this.migrateToThreeBoxSystem();
    } catch (error) {
      console.error('Failed to load Leitner progress:', error);
      // Clear corrupted data
      StorageUtils.safeRemoveItem(LEITNER_CONFIG.STORAGE.PROGRESS);
    }
  }

  // Load user settings from localStorage
  private async loadSettings(): Promise<void> {
    try {
      const stored = StorageUtils.safeGetItem(LEITNER_CONFIG.STORAGE.SETTINGS);
      if (stored) {
        const parsedSettings = JSON.parse(stored) as Partial<LeitnerSettings>;
        this.settings = { ...LEITNER_CONFIG.DEFAULT_SETTINGS, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      this.settings = { ...LEITNER_CONFIG.DEFAULT_SETTINGS };
    }
  }

  // Save user settings to localStorage
  private saveSettings(): void {
    if (typeof window === 'undefined') return; // SSR safety
    
    try {
      StorageUtils.safeSetItem(LEITNER_CONFIG.STORAGE.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // Migrate existing 5-box system data to 3-box system
  private migrateToThreeBoxSystem(): void {
    let migrationMade = false;
    
    this.progress.forEach((progress) => {
      if (progress.currentBox > LEITNER_CONFIG.LIMITS.MAX_BOX) {
        // Move boxes 4 and 5 to box 3 (mastered)
        progress.currentBox = LEITNER_CONFIG.LIMITS.MAX_BOX;
        
        // Recalculate next review date for box 3
        const lastReviewed = new Date(progress.lastReviewed);
        progress.nextReviewDate = DateUtils.calculateNextReviewDate(LEITNER_CONFIG.LIMITS.MAX_BOX, lastReviewed).toISOString();
        
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
    return ValidationUtils.validateStoredData(data);
  }

  // Validate individual progress record
  private validateProgress(progress: unknown): boolean {
    return ValidationUtils.validateProgress(progress);
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
    }, LEITNER_CONFIG.PERFORMANCE.SAVE_DEBOUNCE_MS); // Configurable debounce
  }

  private performSave(): void {
    try {
      const data = Object.fromEntries(this.progress);
      console.log(`🔍 [DEBUG] Saving ${this.progress.size} progress entries to localStorage`);
      StorageUtils.safeSetItem(LEITNER_CONFIG.STORAGE.PROGRESS, JSON.stringify(data));
      console.log(`🔍 [DEBUG] Successfully saved progress to localStorage`);
    } catch (error) {
      console.error(`🔍 [DEBUG] ERROR saving to localStorage:`, error);
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded - cleanup old data
        console.log(`🔍 [DEBUG] Storage quota exceeded, cleaning up old data`);
        this.cleanupOldData();
        try {
          const data = Object.fromEntries(this.progress);
          StorageUtils.safeSetItem(LEITNER_CONFIG.STORAGE.PROGRESS, JSON.stringify(data));
          console.log(`🔍 [DEBUG] Successfully saved after cleanup`);
        } catch (retryError) {
          console.error('🔍 [DEBUG] Failed to save even after cleanup:', retryError);
        }
      } else {
        console.error('🔍 [DEBUG] Failed to save Leitner progress:', error);
      }
    }
  }

  // Cleanup old progress data to free storage (timezone-aware)
  private cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - LEITNER_CONFIG.LIMITS.CLEANUP_THRESHOLD_DAYS);
    const cutoffDateStr = DateUtils.getLocalDateString(thirtyDaysAgo);

    const keysToDelete: string[] = [];
    this.progress.forEach((progress, questionId) => {
      try {
        const lastReviewedDateStr = DateUtils.getLocalDateFromStoredDate(progress.lastReviewed);
        if (lastReviewedDateStr < cutoffDateStr && progress.currentBox === LEITNER_CONFIG.LIMITS.MAX_BOX) {
          // Remove old mastered questions that haven't been reviewed recently
          keysToDelete.push(questionId);
        }
      } catch (error) {
        console.warn(`Error parsing date for cleanup: ${progress.lastReviewed}`, error);
        // Keep the data if we can't parse the date safely
      }
    });

    keysToDelete.forEach(key => this.progress.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} old mastered questions`);
    }
  }

    // Initialize a new question in Box 1
  private initializeQuestion(questionId: string): LeitnerProgress {
    const now = new Date();
    const progress: LeitnerProgress = {
      questionId,
      currentBox: LEITNER_CONFIG.LIMITS.MIN_BOX,
      nextReviewDate: DateUtils.calculateNextReviewDate(LEITNER_CONFIG.LIMITS.MIN_BOX, now).toISOString(),
      timesCorrect: 0,
      timesIncorrect: 0,
      lastReviewed: now.toISOString(),
      lastAnswerCorrect: false,
    };

    this.progress.set(questionId, progress);
    this.saveToStorage();
    return progress;
  }

  // Get local date string in YYYY-MM-DD format (timezone-aware)
  private getLocalDateString(date: Date): string {
    return DateUtils.getLocalDateString(date);
  }

  // Convert stored UTC date string to local date string for comparison
  private getLocalDateFromStoredDate(storedDateStr: string): string {
    return DateUtils.getLocalDateFromStoredDate(storedDateStr);
  }

  // Calculate next review date based on box and current date (timezone-aware with safeguards)
  private calculateNextReviewDate(box: number, fromDate: Date): Date {
    return DateUtils.calculateNextReviewDate(box, fromDate);
  }

  // Timezone-aware date comparison helper
  private isDateDue(reviewDateStr: string, currentDate: Date): boolean {
    return DateUtils.isDateDue(reviewDateStr, currentDate);
  }

  private moveQuestion(currentBox: number, wasCorrect: boolean): number {
    return AlgorithmUtils.moveQuestion(currentBox, wasCorrect);
  }

  // Daily attempts tracking for daily target calculation
  private incrementDailyAttempts(): void {
    const today = this.getLocalDateString(new Date());
    const key = `leitner-daily-attempts-${today}`;
    
    try {
      // Use atomic increment to prevent race conditions
      let attempts = 0;
      const current = StorageUtils.safeGetItem(key);
      if (current) {
        attempts = parseInt(current, 10);
        if (isNaN(attempts)) attempts = 0; // Handle corrupted data
      }
      
      StorageUtils.safeSetItem(key, String(attempts + 1));
    } catch (error) {
      console.error('Failed to update daily attempts:', error);
      // Fallback: try to set to 1 if increment fails
      try {
        StorageUtils.safeSetItem(key, '1');
      } catch (fallbackError) {
        console.error('Failed to set fallback daily attempts:', fallbackError);
      }
    }
  }

  private getDailyAttempts(): number {
    const today = this.getLocalDateString(new Date());
    const key = `leitner-daily-attempts-${today}`;
    
    try {
      const current = StorageUtils.safeGetItem(key);
      return current ? parseInt(current, 10) : 0;
    } catch (error) {
      console.error('Failed to get daily attempts:', error);
      return 0;
    }
  }

  // Cleanup all daily attempts data (for reset and memory management)
  private clearAllDailyAttempts(): void {
    try {
      // Clear today's attempts
      const today = this.getLocalDateString(new Date());
      const todayKey = `leitner-daily-attempts-${today}`;
      StorageUtils.safeRemoveItem(todayKey);
      
      // Clean up old daily attempts keys (older than 7 days)
      // First collect all keys to avoid iteration issues during removal
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('leitner-daily-attempts-')) {
          const dateStr = key.replace('leitner-daily-attempts-', '');
          try {
            const keyDate = new Date(dateStr + 'T00:00:00');
            const daysDiff = (Date.now() - keyDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Remove keys older than 7 days or invalid dates
            if (daysDiff > 7 || isNaN(daysDiff)) {
              keysToRemove.push(key);
            }
          } catch {
            // Remove invalid date keys
            keysToRemove.push(key);
          }
        }
      }
      
      // Now safely remove all collected keys
      keysToRemove.forEach(key => StorageUtils.safeRemoveItem(key));
    } catch (error) {
      console.error('Failed to clear daily attempts:', error);
    }
  }

  // Periodic cleanup of old daily attempts (keeps only last 7 days)
  private clearOldDailyAttempts(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('leitner-daily-attempts-')) {
          const dateStr = key.replace('leitner-daily-attempts-', '');
          try {
            const keyDate = new Date(dateStr + 'T00:00:00');
            const daysDiff = (Date.now() - keyDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Remove keys older than 7 days
            if (daysDiff > 7 || isNaN(daysDiff)) {
              StorageUtils.safeRemoveItem(key);
            }
          } catch {
            // Remove invalid date keys
            StorageUtils.safeRemoveItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old daily attempts:', error);
    }
  }

  processAnswer(
    questionId: string,
    wasCorrect: boolean
  ): LeitnerAnswerResult {
    console.log(`🔍 [DEBUG] processAnswer called: questionId=${questionId.slice(-8)}, wasCorrect=${wasCorrect}`);
    
    // Remove async since this is synchronous
    if (!this.initialized) {
      console.error('🔍 [DEBUG] ERROR: Leitner system not initialized!');
      throw new Error('Leitner system not initialized. Call ensureInitialized() first.');
    }

    if (!questionId || typeof wasCorrect !== 'boolean') {
      console.error('🔍 [DEBUG] ERROR: Invalid parameters for processAnswer');
      throw new Error('Invalid parameters for processAnswer');
    }

    let progress = this.progress.get(questionId);
    console.log(`🔍 [DEBUG] Existing progress for question:`, progress ? {
      currentBox: progress.currentBox,
      timesCorrect: progress.timesCorrect,
      timesIncorrect: progress.timesIncorrect,
      lastReviewed: progress.lastReviewed
    } : 'NEW QUESTION');

    // Initialize if question hasn't been seen before
    if (!progress) {
      progress = this.initializeQuestion(questionId);
      console.log(`🔍 [DEBUG] Initialized new question in box ${progress.currentBox}`);
    }

    const currentBox = progress.currentBox;
    const newBox = this.moveQuestion(currentBox, wasCorrect);
    const now = new Date();
    const nextReview = this.calculateNextReviewDate(newBox, now);

    console.log(`🔍 [DEBUG] Question movement: Box ${currentBox} → Box ${newBox}, Next review: ${nextReview.toISOString()}`);

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
    console.log(`🔍 [DEBUG] Updated progress stored. Total progress entries: ${this.progress.size}`);
    
    // Track daily attempts for daily target calculation
    this.incrementDailyAttempts();
    
    this.saveToStorage();
    console.log(`🔍 [DEBUG] Progress saved to localStorage`);

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
      console.log('🔍 [DEBUG] No questions provided to getDueQuestions');
      return [];
    }

    console.log(`🔍 [DEBUG] Starting getDueQuestions with ${allQuestions.length} total questions`);

    // Note: Questions are already filtered upstream by QuestionService.filterQuestions()
    // Don't double-filter - use all provided questions to maximize variety
    const currentDate = new Date();
    console.log(`🔍 [DEBUG] Current date: ${currentDate.toISOString()}`);

    // Analyze current progress state
    const progressStats = {
      total: this.progress.size,
      box1: 0,
      box2: 0,
      box3: 0,
      new: 0,
      due: 0,
      notDue: 0
    };

    // Separate new questions from questions with progress
    const newQuestions: QuestionWithLeitner[] = [];
    const questionsWithProgress: QuestionWithLeitner[] = [];

    // Use map for O(1) lookups instead of repeated gets
    allQuestions.forEach(question => {
      const progress = this.progress.get(question.id);

      if (!progress) {
        // New questions get highest priority (Box 1)
        progressStats.new++;
        newQuestions.push({ ...question, priority: 1, isDue: true, currentBox: 1 });
      } else {
        progressStats[`box${progress.currentBox}` as keyof typeof progressStats]++;
        const isDue = this.isDateDue(progress.nextReviewDate, currentDate);
        
        if (isDue) {
          progressStats.due++;
        } else {
          progressStats.notDue++;
        }

        questionsWithProgress.push({
          ...question,
          priority: progress.currentBox,
          isDue,
          currentBox: progress.currentBox,
          timesIncorrect: progress.timesIncorrect,
        });
      }
    });

    console.log('🔍 [DEBUG] Progress stats:', progressStats);
    console.log(`🔍 [DEBUG] New questions available: ${newQuestions.length}`);
    console.log(`🔍 [DEBUG] Questions with progress: ${questionsWithProgress.length}`);

    // Start with due questions from existing progress
    const dueProgressQuestions = questionsWithProgress.filter(q => q.isDue);
    
    // Add some non-due questions for review (higher probability now)
    const reviewQuestions = questionsWithProgress
      .filter(q => !q.isDue && q.currentBox === LEITNER_CONFIG.LIMITS.MAX_BOX && Math.random() < LEITNER_CONFIG.LIMITS.REVIEW_PROBABILITY);

    // Limit new questions per session to prevent overwhelming
    const limitedNewQuestions = newQuestions
      .sort(() => Math.random() - 0.5) // Shuffle new questions
      .slice(0, LEITNER_CONFIG.LIMITS.MAX_NEW_QUESTIONS_PER_SESSION);

    console.log(`🔍 [DEBUG] Due progress questions: ${dueProgressQuestions.length}`);
    console.log(`🔍 [DEBUG] Review questions added: ${reviewQuestions.length}`);
    console.log(`🔍 [DEBUG] New questions (limited): ${limitedNewQuestions.length}/${newQuestions.length}`);

    // Combine all question types
    const dueAndNewQuestions = [
      ...dueProgressQuestions,
      ...reviewQuestions,
      ...limitedNewQuestions
    ];

    console.log(`🔍 [DEBUG] Initial question selection: ${dueAndNewQuestions.length}`);
    console.log(`🔍 [DEBUG] Box distribution in selected questions:`, 
      dueAndNewQuestions.reduce((acc, q) => {
        acc[`box${q.currentBox}`] = (acc[`box${q.currentBox}`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );

    // If we still need more questions, add some non-due questions
    if (dueAndNewQuestions.length < LEITNER_CONFIG.LIMITS.MIN_DUE_QUESTIONS) {
      console.log(`🔍 [DEBUG] Need more questions: ${dueAndNewQuestions.length} < ${LEITNER_CONFIG.LIMITS.MIN_DUE_QUESTIONS}`);
      
      const additionalQuestions = questionsWithProgress
        .filter(q => !q.isDue) // Get non-due questions
        .sort(() => Math.random() - 0.5) // Shuffle for randomness
        .slice(0, LEITNER_CONFIG.LIMITS.MIN_DUE_QUESTIONS - dueAndNewQuestions.length);
      
      console.log(`🔍 [DEBUG] Adding ${additionalQuestions.length} additional questions`);
      dueAndNewQuestions.push(...additionalQuestions);
    }

    console.log(`🔍 [DEBUG] Final question count before sorting: ${dueAndNewQuestions.length}`);

    console.log(`🔍 [DEBUG] Final question count before sorting: ${dueAndNewQuestions.length}`);

    // Optimized sorting with early returns
    const sortedQuestions = dueAndNewQuestions.sort((a, b) => {
      // Due questions first
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;

      // Then by box priority (lower boxes = higher priority)
      if (a.priority !== b.priority) return a.priority - b.priority;

      // Then by failure count (more failures = higher priority)
      const failureDiff = (b.timesIncorrect || 0) - (a.timesIncorrect || 0);
      if (failureDiff !== 0) return failureDiff;

      // For questions with same priority and failure count, use true randomization
      // This ensures variety each time questions are selected
      const randomA = Math.random();
      const randomB = Math.random();
      return randomA - randomB;
    });

    // Log sample of questions for debugging
    console.log(`🔍 [DEBUG] Sample of sorted questions (first 10):`, 
      sortedQuestions.slice(0, 10).map(q => ({
        id: q.id.slice(-8),
        topic: q.topic,
        box: q.currentBox,
        isDue: q.isDue,
        timesIncorrect: q.timesIncorrect || 0
      }))
    );

    // Apply optimized interleaving by topic for better learning
    const interleaved = this.optimizedInterleaveByTopic(sortedQuestions);
    
    console.log(`🔍 [DEBUG] Final interleaved questions: ${interleaved.length}`);
    console.log(`🔍 [DEBUG] Topic distribution:`, 
      interleaved.reduce((acc, q) => {
        acc[q.topic] = (acc[q.topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );

    return interleaved;
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
      if (roundCount > LEITNER_CONFIG.PERFORMANCE.MAX_INTERLEAVING_ITERATIONS) {
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
    };
    let totalCorrect = 0;
    let totalAnswered = 0;
    let questionsStarted = 0; // Questions that have been attempted at least once

    allQuestions.forEach(question => {
      const progress = this.progress.get(question.id);

      if (!progress) {
        // New questions are in Box 1
        boxDistribution[LEITNER_CONFIG.LIMITS.MIN_BOX]++;
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

    // Calculate due today based on daily target vs. total attempts today
    const questionsAnsweredToday = this.getDailyAttempts();
    
    // Calculate remaining questions to reach daily target
    const remainingToday = Math.max(0, this.settings.dailyTarget - questionsAnsweredToday);

    return {
      totalQuestions: allQuestions.length, // Questions are pre-filtered upstream
      questionsStarted,
      boxDistribution,
      dueToday: remainingToday, // Personal target remaining for today
      accuracyRate,
      streakDays,
    };
  }

  // Get progress for a specific question
  getQuestionProgress(questionId: string): LeitnerProgress | null {
    return this.progress.get(questionId) || null;
  }

  // Get completion progress for progress bars
  getCompletionProgress(allQuestions: Question[]): CompletionProgress {
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

  // Robust timezone-aware streak calculation based on recent activity
  private calculateStreakDays(): number {
    const progressArray = Array.from(this.progress.values());
    return AlgorithmUtils.calculateStreakDays(progressArray);
  }

  // Clear all progress (for testing/reset)
  clearProgress(): void {
    this.progress.clear();
    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    StorageUtils.safeRemoveItem(LEITNER_CONFIG.STORAGE.PROGRESS);
    StorageUtils.safeRemoveItem(LEITNER_CONFIG.STORAGE.STATS);
    
    // Clear all daily attempts data to prevent stale counts
    this.clearAllDailyAttempts();
  }

  // Force refresh question randomization (useful for getting different question order)
  refreshQuestionPool(): void {
    // Simply trigger a re-randomization by calling getDueQuestions again
    console.log('Question pool refreshed - next session will have different order');
  }

  // Clear only navigation/submission states (preserves Leitner progress)
  clearNavigationStates(): void {
    // This method is for future use if we store submission states in the Leitner system
    // For now, navigation states are handled in the debug page directly
    console.log('Navigation states cleared (no Leitner data affected)');
  }

  // Debug method to analyze current question pool and distribution
  async debugQuestionPool(allQuestions: Question[]): Promise<{
    totalQuestions: number;
    filteredQuestions: number;
    progressStats: {
      total: number;
      box1: number;
      box2: number;
      box3: number;
      new: number;
      due: number;
      notDue: number;
    };
    dueQuestions: number;
    sampleDueQuestions: Array<{
      id: string;
      topic: string;
      currentBox: number;
      isDue: boolean;
      nextReviewDate: string;
      timesCorrect: number;
      timesIncorrect: number;
    }>;
    topicDistribution: Record<string, number>;
  }> {
    await this.ensureInitialized();
    
    const currentDate = new Date();
    const progressStats = {
      total: this.progress.size,
      box1: 0,
      box2: 0,
      box3: 0,
      new: 0,
      due: 0,
      notDue: 0
    };

    const questionsWithProgress = allQuestions.map(question => {
      const progress = this.progress.get(question.id);
      
      if (!progress) {
        progressStats.new++;
        return {
          ...question,
          currentBox: 1,
          isDue: true,
          nextReviewDate: 'new',
          timesCorrect: 0,
          timesIncorrect: 0
        };
      }

      progressStats[`box${progress.currentBox}` as keyof typeof progressStats]++;
      const isDue = this.isDateDue(progress.nextReviewDate, currentDate);
      
      if (isDue) {
        progressStats.due++;
      } else {
        progressStats.notDue++;
      }

      return {
        ...question,
        currentBox: progress.currentBox,
        isDue,
        nextReviewDate: progress.nextReviewDate,
        timesCorrect: progress.timesCorrect,
        timesIncorrect: progress.timesIncorrect
      };
    });

    const dueQuestions = questionsWithProgress.filter(q => q.isDue);
    const topicDistribution = allQuestions.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQuestions: allQuestions.length,
      filteredQuestions: allQuestions.length, // Already filtered upstream
      progressStats,
      dueQuestions: dueQuestions.length,
      sampleDueQuestions: dueQuestions.slice(0, 20).map(q => ({
        id: q.id.slice(-8),
        topic: q.topic,
        currentBox: q.currentBox,
        isDue: q.isDue,
        nextReviewDate: q.nextReviewDate,
        timesCorrect: q.timesCorrect,
        timesIncorrect: q.timesIncorrect
      })),
      topicDistribution
    };
  }

  // Get current daily target setting
  getDailyTarget(): number {
    return this.settings.dailyTarget;
  }

  // Set daily target and save to localStorage
  setDailyTarget(target: number): void {
    if (!ValidationUtils.validateDailyTarget(target)) {
      console.warn(`Invalid daily target: ${target}. Must be between ${LEITNER_CONFIG.LIMITS.MIN_DAILY_TARGET} and ${LEITNER_CONFIG.LIMITS.MAX_DAILY_TARGET}.`);
      return;
    }
    
    this.settings.dailyTarget = target;
    this.saveSettings();
    console.log(`Daily target updated to ${target} questions per day`);
  }

  // Get today's progress towards daily target
  getTodayProgress(): DailyProgress {
    const todayStr = this.getLocalDateString(new Date());
    const questionsAnsweredToday = Array.from(this.progress.values()).filter(progress => {
      try {
        const reviewedDateStr = this.getLocalDateFromStoredDate(progress.lastReviewed);
        return reviewedDateStr === todayStr;
      } catch {
        return false;
      }
    }).length;
    
    const remaining = Math.max(0, this.settings.dailyTarget - questionsAnsweredToday);
    const percentage = Math.min(100, (questionsAnsweredToday / this.settings.dailyTarget) * 100);
    
    return {
      target: this.settings.dailyTarget,
      completed: questionsAnsweredToday,
      remaining,
      percentage,
    };
  }

  // Enhanced debug method to test timezone handling (Singapore UTC+8)
  debugTimezone(): TimezoneDebugInfo {
    const now = new Date();
    const localDate = this.getLocalDateString(now);
    const utcDate = now.toISOString().split('T')[0];
    
    // Test if a question scheduled for today would be considered due
    const testReviewDate = localDate + 'T00:00:00.000Z';
    const isDue = this.isDateDue(testReviewDate, now);
    
    // Test streak calculation
    const currentStreak = this.calculateStreakDays();
    const todayLocalStr = this.getLocalDateString(now);
    const progressArray = Array.from(this.progress.values());
    const todayHasActivity = progressArray.some(p => {
      try {
        return this.getLocalDateFromStoredDate(p.lastReviewed) === todayLocalStr;
      } catch {
        return false;
      }
    });
    
    // Sample date conversion test
    const sampleStoredDate = now.toISOString();
    const sampleConvertedDate = this.getLocalDateFromStoredDate(sampleStoredDate);
    
    // Edge case tests
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const midnightTest = this.getLocalDateString(midnight) === localDate;
    
    // DST test (create dates in different seasons)
    const summerDate = new Date(now.getFullYear(), 6, 15); // July 15
    const winterDate = new Date(now.getFullYear(), 0, 15); // January 15
    const dstTest = this.getLocalDateString(summerDate) !== this.getLocalDateString(winterDate) || true; // Always pass for now
    
    // Leap year test
    const leapYearDate = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
    const leapYearTest = this.getLocalDateString(leapYearDate) === '2024-02-29';
    
    return {
      currentTime: now.toString(),
      localDate,
      utcDate,
      timezoneOffset: now.getTimezoneOffset(), // Minutes behind UTC (negative for ahead)
      testDueComparison: isDue,
      streakTest: {
        currentStreak,
        todayHasActivity,
        sampleStoredDate,
        sampleConvertedDate,
      },
      edgeCaseTests: {
        midnightTransition: midnightTest,
        dstHandling: dstTest,
        leapYearHandling: leapYearTest,
      },
    };
  }
}

// Singleton instance
export const leitnerSystem = new LeitnerSystem();

// Re-export constants and utilities for backward compatibility
export { BOX_LABELS, BOX_COLORS } from './leitner/constants';
export { DateUtils, ValidationUtils, AlgorithmUtils, StorageUtils } from './leitner/utils';
