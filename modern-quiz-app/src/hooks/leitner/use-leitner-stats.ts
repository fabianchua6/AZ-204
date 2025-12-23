'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types/quiz';
import { leitnerSystem, type LeitnerStats } from '@/lib/leitner';
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

export function useLeitnerStats(questions: Question[], submissionStates: Record<string, SubmissionState>) {
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
        const timeoutId = setTimeout(() => {
            try {
                const filteredQs = questionService.filterQuestions(questions);
                const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQs);
                const leitnerStats = leitnerSystem.getStats(filteredQs);

                setStats({
                    totalQuestions: leitnerCompletion.totalQuestions,
                    answeredQuestions: leitnerCompletion.answeredQuestions,
                    correctAnswers: leitnerCompletion.correctAnswers,
                    incorrectAnswers: leitnerCompletion.incorrectAnswers,
                    accuracy: leitnerCompletion.accuracy,
                    leitner: leitnerStats,
                });
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [questions, submissionStates]); // Update when submissions change

    return stats;
}
