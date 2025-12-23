import { renderHook, waitFor } from '@testing-library/react';
import { useLeitnerStats } from '../use-leitner-stats';
import { leitnerSystem } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import type { Question } from '@/types/quiz';

// Mock dependencies
jest.mock('@/lib/leitner', () => ({
    leitnerSystem: {
        getCompletionProgress: jest.fn(),
        getStats: jest.fn(),
    },
}));

jest.mock('@/lib/question-service', () => ({
    questionService: {
        filterQuestions: jest.fn(),
    },
}));

describe('useLeitnerStats', () => {
    const mockQuestions: Question[] = [
        {
            id: 'q1',
            question: 'Q1',
            options: ['A'],
            answerIndexes: [0],
            topic: 'T1',
            hasCode: false,
            answer: 'A'
        },
        {
            id: 'q2',
            question: 'Q2',
            options: ['B'],
            answerIndexes: [1],
            topic: 'T1',
            hasCode: false,
            answer: 'B'
        },
    ];

    const mockSubmissionStates = {
        q1: { isSubmitted: true, isCorrect: true, showAnswer: true, submittedAt: 0, submittedAnswers: [0] },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (questionService.filterQuestions as jest.Mock).mockReturnValue(mockQuestions);
        (leitnerSystem.getCompletionProgress as jest.Mock).mockReturnValue({
            totalQuestions: 2,
            answeredQuestions: 1,
            correctAnswers: 1,
            incorrectAnswers: 0,
            accuracy: 100,
        });
        (leitnerSystem.getStats as jest.Mock).mockReturnValue({
            totalQuestions: 2,
            questionsStarted: 1,
            boxDistribution: { 1: 1, 2: 1 },
            dueToday: 1,
            accuracyRate: 100,
            streakDays: 1,
        });
    });

    it('initializes with zero stats', async () => {
        const { result } = renderHook(() => useLeitnerStats([], {}));

        expect(result.current.totalQuestions).toBe(0);
        expect(result.current.leitner.totalQuestions).toBe(0);
    });

    it('updates stats when questions are provided', async () => {
        const { result } = renderHook(() => useLeitnerStats(mockQuestions, {}));

        await waitFor(() => {
            expect(result.current.totalQuestions).toBe(2);
            expect(result.current.leitner.questionsStarted).toBe(1);
        });

        expect(questionService.filterQuestions).toHaveBeenCalledWith(mockQuestions);
        expect(leitnerSystem.getCompletionProgress).toHaveBeenCalled();
        expect(leitnerSystem.getStats).toHaveBeenCalled();
    });

    it('re-calculates stats when submissionStates change', async () => {
        const { result, rerender } = renderHook(
            ({ subs }) => useLeitnerStats(mockQuestions, subs),
            { initialProps: { subs: {} } }
        );

        await waitFor(() => {
            expect(result.current.totalQuestions).toBe(2);
        });

        jest.clearAllMocks();

        // Rerender with new submissions
        rerender({ subs: mockSubmissionStates });

        await waitFor(() => {
            // It should trigger another calculation
            expect(leitnerSystem.getStats).toHaveBeenCalled();
        });
    });
});
