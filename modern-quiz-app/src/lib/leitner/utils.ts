// Leitner System Utility Functions
// Timezone-aware date operations and validation helpers for Singapore UTC+8

import { LEITNER_CONFIG } from './constants';
import type { LeitnerProgress } from './types';

/**
 * Date Utilities - All timezone-aware for Singapore (UTC+8)
 */
export class DateUtils {
  /**
   * Get local date string in YYYY-MM-DD format (Singapore timezone)
   */
  static getLocalDateString(date: Date): string {
    // Use local timezone instead of UTC to handle Singapore timezone correctly
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert stored UTC date string to local date string for comparison
   */
  static getLocalDateFromStoredDate(storedDateStr: string): string {
    try {
      // Parse the stored UTC date and convert to local timezone
      const storedDate = new Date(storedDateStr);
      if (isNaN(storedDate.getTime())) {
        console.warn(`Invalid stored date: ${storedDateStr}`);
        return '1970-01-01'; // Fallback to epoch
      }
      return this.getLocalDateString(storedDate);
    } catch (error) {
      console.warn(`Error parsing stored date: ${storedDateStr}`, error);
      return '1970-01-01'; // Fallback to epoch
    }
  }

  /**
   * Calculate next review date based on box and current date (timezone-aware with safeguards)
   */
  static calculateNextReviewDate(box: number, fromDate: Date): Date {
    try {
      const interval = LEITNER_CONFIG.INTERVALS[box as keyof typeof LEITNER_CONFIG.INTERVALS];
      
      if (!interval || interval < 1) {
        console.warn(`Invalid interval for box ${box}, defaulting to 1 day`);
        return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
      }
      
      // Create a new date at midnight local time to avoid timezone issues
      const localFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      
      // Validate the constructed date
      if (isNaN(localFromDate.getTime())) {
        console.warn(`Invalid fromDate: ${fromDate}, using current date`);
        const now = new Date();
        const fallbackDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return new Date(fallbackDate.getTime() + interval * 24 * 60 * 60 * 1000);
      }
      
      const nextDate = new Date(localFromDate.getTime() + interval * 24 * 60 * 60 * 1000);
      
      // Validate the result
      if (isNaN(nextDate.getTime())) {
        console.warn(`Invalid calculated nextDate for box ${box}, using fallback`);
        return new Date(fromDate.getTime() + interval * 24 * 60 * 60 * 1000);
      }
      
      return nextDate;
    } catch (error) {
      console.error(`Error calculating next review date for box ${box}:`, error);
      // Fallback to simple calculation
      return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Timezone-aware date comparison helper
   */
  static isDateDue(reviewDateStr: string, currentDate: Date): boolean {
    try {
      // Extract date part from stored review date and convert to local timezone
      const reviewDateLocal = this.getLocalDateFromStoredDate(reviewDateStr);
      
      // Get current date in local timezone (Singapore time)
      const currentDateLocal = this.getLocalDateString(currentDate);
      
      // Compare date strings - due if review date is today or earlier
      return reviewDateLocal <= currentDateLocal;
    } catch (error) {
      console.warn(`Error in isDateDue comparison: ${reviewDateStr}`, error);
      return false; // Safe fallback - don't consider due if there's an error
    }
  }
}

/**
 * Validation Utilities
 */
export class ValidationUtils {
  /**
   * Validate stored data structure
   */
  static validateStoredData(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (typeof key !== 'string' || !this.validateProgress(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate individual progress record
   */
  static validateProgress(progress: unknown): boolean {
    if (!progress || typeof progress !== 'object') return false;

    const p = progress as Record<string, unknown>;
    return (
      typeof p.questionId === 'string' &&
      typeof p.currentBox === 'number' &&
      p.currentBox >= LEITNER_CONFIG.LIMITS.MIN_BOX &&
      p.currentBox <= LEITNER_CONFIG.LIMITS.MAX_BOX &&
      typeof p.nextReviewDate === 'string' &&
      typeof p.timesCorrect === 'number' &&
      typeof p.timesIncorrect === 'number'
    );
  }

  /**
   * Validate daily target setting
   */
  static validateDailyTarget(target: number): boolean {
    return (
      typeof target === 'number' &&
      target >= LEITNER_CONFIG.LIMITS.MIN_DAILY_TARGET &&
      target <= LEITNER_CONFIG.LIMITS.MAX_DAILY_TARGET
    );
  }
}

/**
 * Algorithm Utilities
 */
export class AlgorithmUtils {
  /**
   * Stable pseudo-random function for consistent sorting with improved distribution
   */
  static stableRandom(questionId: string, seed: number): number {
    // Improved hash function that creates better variation between seeds
    let hash = seed; // Start with the seed value
    
    // Mix the seed with each character of the question ID
    for (let i = 0; i < questionId.length; i++) {
      const char = questionId.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff; // Ensure 32-bit integer
      hash = ((hash << 13) ^ hash) & 0xffffffff; // Additional mixing
      hash = ((hash * 0x85ebca6b) ^ (hash >>> 16)) & 0xffffffff; // Multiply by prime and XOR
    }
    
    // Final mixing step to improve distribution
    hash ^= hash >>> 16;
    hash *= 0x9e3779b9; // Golden ratio constant
    hash ^= hash >>> 16;
    
    // Ensure positive and normalize to 0-1
    return (hash & 0x7fffffff) / 0x7fffffff;
  }

  /**
   * Calculate question movement between boxes
   */
  static moveQuestion(currentBox: number, wasCorrect: boolean): number {
    if (currentBox < LEITNER_CONFIG.LIMITS.MIN_BOX || currentBox > LEITNER_CONFIG.LIMITS.MAX_BOX) {
      console.warn(`Invalid current box: ${currentBox}, defaulting to ${LEITNER_CONFIG.LIMITS.MIN_BOX}`);
      return LEITNER_CONFIG.LIMITS.MIN_BOX;
    }

    if (wasCorrect) {
      return Math.min(currentBox + 1, LEITNER_CONFIG.LIMITS.MAX_BOX); // Move up, max Box 3
    } else {
      return LEITNER_CONFIG.LIMITS.MIN_BOX; // Reset to Box 1 for incorrect answers
    }
  }

  /**
   * Calculate streak days based on recent activity
   */
  static calculateStreakDays(progressArray: LeitnerProgress[]): number {
    const today = new Date();
    let streak = 0;
    
    if (progressArray.length === 0) {
      return 0; // No progress data means no streak
    }

    // Check last 30 days for activity using proper timezone handling
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const targetDateStr = DateUtils.getLocalDateString(checkDate);

      // Check if any question was reviewed on this date
      const hasActivity = progressArray.some(progress => {
        try {
          const reviewedDateStr = DateUtils.getLocalDateFromStoredDate(progress.lastReviewed);
          return reviewedDateStr === targetDateStr;
        } catch (error) {
          console.warn(`Error parsing lastReviewed date for streak: ${progress.lastReviewed}`, error);
          return false;
        }
      });

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        // Break streak if no activity (but don't count today if it's just starting)
        break;
      }
    }

    return streak;
  }
}

/**
 * Storage Utilities
 */
export class StorageUtils {
  /**
   * Safe localStorage operations with error handling
   */
  static safeGetItem(key: string): string | null {
    if (typeof window === 'undefined') return null; // SSR safety
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage key: ${key}`, error);
      return null;
    }
  }

  static safeSetItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false; // SSR safety
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to write to localStorage key: ${key}`, error);
      return false;
    }
  }

  static safeRemoveItem(key: string): boolean {
    if (typeof window === 'undefined') return false; // SSR safety
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage key: ${key}`, error);
      return false;
    }
  }
}
