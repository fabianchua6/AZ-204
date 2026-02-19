'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types/quiz';
import type { LeitnerStats } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';

export interface EnhancedQuizStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  leitner: LeitnerStats;
}

import type { SubmissionState } from './use-leitner-progress';

export function useLeitnerStats(
  questions: Question[],
  submissionStates: Record<string, SubmissionState>
) {
  const [stats, setStats] = useState<EnhancedQuizStats>({
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    leitner: {
      totalQuestions: 0,
      questionsStarted: 0,
      boxDistribution: {},
      dueToday: 0,
      accuracyRate: 0,
      streakDays: 0,
    },
  });

  useEffect(() => {
    if (questions.length === 0) return;

    // Debounce stats calculation
    const timeoutId = setTimeout(async () => {
      try {
        // Route through QuestionService for consistent filtering + caching
        const appStats = await questionService.getAppStatistics(questions);

        setStats({
          totalQuestions: appStats.totalQuestions,
          answeredQuestions: appStats.answeredQuestions,
          correctAnswers: appStats.correctAnswers,
          incorrectAnswers: appStats.incorrectAnswers,
          accuracy: appStats.completionAccuracy,
          leitner: {
            totalQuestions: appStats.totalQuestions,
            questionsStarted: appStats.questionsStarted,
            boxDistribution: appStats.boxDistribution,
            dueToday: appStats.dueToday,
            accuracyRate: appStats.accuracyRate,
            streakDays: appStats.streakDays,
          },
        });
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [questions, submissionStates]); // Update when submissions change

  return stats;
}
