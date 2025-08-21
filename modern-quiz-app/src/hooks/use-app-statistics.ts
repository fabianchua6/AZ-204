'use client';

import { useState, useEffect } from 'react';
import { questionService } from '@/lib/question-service';
import type { Question } from '@/types/quiz';

interface UseAppStatisticsResult {
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
  filteredQuestions: Question[];
  loading: boolean;
  error: string | null;
}

/**
 * Single hook for accessing app-wide statistics
 * Replaces manual filtering in individual components
 */
export function useAppStatistics(
  questions: Question[]
): UseAppStatisticsResult {
  const [stats, setStats] = useState<UseAppStatisticsResult>({
    totalQuestions: 0,
    questionsStarted: 0,
    boxDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    dueToday: 0,
    accuracyRate: 0,
    streakDays: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    completionAccuracy: 0,
    filteredQuestions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        const appStats = await questionService.getAppStatistics(questions);

        setStats({
          totalQuestions: appStats.totalQuestions,
          questionsStarted: appStats.questionsStarted,
          boxDistribution: appStats.boxDistribution,
          dueToday: appStats.dueToday,
          accuracyRate: appStats.accuracyRate,
          streakDays: appStats.streakDays,
          answeredQuestions: appStats.answeredQuestions,
          correctAnswers: appStats.correctAnswers,
          incorrectAnswers: appStats.incorrectAnswers,
          completionAccuracy: appStats.completionAccuracy,
          filteredQuestions: appStats.filteredQuestions,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load app statistics:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    if (questions.length > 0) {
      loadStats();
    }
  }, [questions]);

  return stats;
}
