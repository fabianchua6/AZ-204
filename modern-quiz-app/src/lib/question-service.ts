'use client';

import type { Question } from '@/types/quiz';
import { leitnerSystem } from './leitner';
import { debug } from './logger';

export interface AppStatistics {
  totalQuestions: number;
  questionsStarted: number;
  boxDistribution: Record<number, number>;
  dueToday: number;
  accuracyRate: number;
  streakDays: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completionAccuracy: number;
  filtering: {
    total: number;
    codeQuestions: number;
    noOptionsQuestions: number;
    solutionGoalQuestions: number;
    filtered: number;
    excluded: number;
  };
  filteredQuestions: Question[];
}

// Simple cache keyed by the array reference
const statsCache = new WeakMap<
  Question[],
  { stats: AppStatistics; ts: number }
>();
const CACHE_TTL_MS = 15_000; // 15s is enough for rapid navigation

/**
 * Single source of truth for question filtering and statistics
 */
export class QuestionService {
  private static instance: QuestionService;
  static getInstance(): QuestionService {
    if (!QuestionService.instance)
      QuestionService.instance = new QuestionService();
    return QuestionService.instance;
  }

  filterQuestions(questions: Question[]): Question[] {
    return questions.filter(q => {
      // Filter out code questions
      if (q.hasCode) return false;
      
      // Filter out questions with no options
      if (q.options.length === 0) return false;
      
      // Filter out "Does this solution meet the goal?" questions
      if (q.question.toLowerCase().includes('does the solution meet the goal') ||
          q.question.toLowerCase().includes('does this solution meet') ||
          q.question.toLowerCase().includes('solution meet the goal')) {
        return false;
      }
      
      return true;
    });
  }

  getFilteringStats(questions: Question[]) {
    const total = questions.length;
    const codeQuestions = questions.filter(q => q.hasCode).length;
    const noOptionsQuestions = questions.filter(
      q => q.options.length === 0
    ).length;
    const solutionGoalQuestions = questions.filter(q => 
      q.question.toLowerCase().includes('does the solution meet the goal') ||
      q.question.toLowerCase().includes('does this solution meet') ||
      q.question.toLowerCase().includes('solution meet the goal')
    ).length;
    const filtered = this.filterQuestions(questions).length;
    return {
      total,
      codeQuestions,
      noOptionsQuestions,
      solutionGoalQuestions,
      filtered,
      excluded: total - filtered,
    };
  }

  async getAppStatistics(
    questions: Question[],
    { force = false }: { force?: boolean } = {}
  ): Promise<AppStatistics> {
    if (!force) {
      const cached = statsCache.get(questions);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.stats;
    }

    await leitnerSystem.ensureInitialized();

    const filteredQuestions = this.filterQuestions(questions);
    const leitnerStats = leitnerSystem.getStats(filteredQuestions);
    const completionStats =
      leitnerSystem.getCompletionProgress(filteredQuestions);
    const filteringStats = this.getFilteringStats(questions);

    const stats: AppStatistics = {
      totalQuestions: filteredQuestions.length,
      questionsStarted: leitnerStats.questionsStarted,
      boxDistribution: leitnerStats.boxDistribution,
      dueToday: leitnerStats.dueToday,
      accuracyRate: leitnerStats.accuracyRate,
      streakDays: leitnerStats.streakDays,
      answeredQuestions: completionStats.answeredQuestions,
      correctAnswers: completionStats.correctAnswers,
      incorrectAnswers: completionStats.incorrectAnswers,
      completionAccuracy: completionStats.accuracy,
      filtering: filteringStats,
      filteredQuestions,
    };

    statsCache.set(questions, { stats, ts: Date.now() });
    debug('[QuestionService] stats', stats);
    return stats;
  }

  async getDueQuestions(questions: Question[]) {
    const filtered = this.filterQuestions(questions);
    return await leitnerSystem.getDueQuestions(filtered);
  }
}

export const questionService = QuestionService.getInstance();
