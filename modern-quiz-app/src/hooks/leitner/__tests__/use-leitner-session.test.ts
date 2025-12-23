import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeitnerSession } from '../use-leitner-session';
import { leitnerSystem } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import { loadFromLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';

// Mocks
jest.mock('@/lib/leitner', () => ({
    leitnerSystem: {
        ensureInitialized: jest.fn().mockResolvedValue(undefined),
        getDueQuestions: jest.fn(),
    },
}));

jest.mock('@/lib/question-service', () => ({
    questionService: {
        filterQuestions: jest.fn(),
    },
}));

jest.mock('@/lib/utils', () => ({
    saveToLocalStorage: jest.fn(),
    loadFromLocalStorage: jest.fn(),
    isPdfQuestion: jest.fn().mockReturnValue(false),
}));

describe('useLeitnerSession', () => {
    const mockQuestions: Question[] = Array.from({ length: 5 }, (_, i) => ({
        id: `q${i}`,
        question: `Q${i}`,
        options: ['A'],
        answerIndexes: [0],
        topic: 'T1',
        hasCode: false,
        answer: 'A'
    }));

    const mockOnSessionReset = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (questionService.filterQuestions as jest.Mock).mockReturnValue(mockQuestions);
        (leitnerSystem.getDueQuestions as jest.Mock).mockResolvedValue(mockQuestions);
        (loadFromLocalStorage as jest.Mock).mockImplementation((key, defaultValue) => defaultValue);
    });

    it('generates a new session on mount if no saved session', async () => {
        const { result } = renderHook(() => useLeitnerSession({
            questions: mockQuestions,
            onSessionReset: mockOnSessionReset
        }));

        // Should start loading
        expect(result.current.isLoadingSession).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoadingSession).toBe(false);
        });

        expect(result.current.filteredQuestions).toHaveLength(mockQuestions.length);
        expect(leitnerSystem.getDueQuestions).toHaveBeenCalled();
    });

    it('restores a valid saved session', async () => {
        const savedSession = {
            questionIds: ['q0', 'q1'],
            createdAt: Date.now(),
            totalQuestions: 5
        };
        (loadFromLocalStorage as jest.Mock).mockImplementation((key, defaultValue) => {
            if (key === 'leitner-current-session') return savedSession;
            return defaultValue;
        });

        const { result } = renderHook(() => useLeitnerSession({
            questions: mockQuestions,
            onSessionReset: mockOnSessionReset
        }));

        await waitFor(() => {
            expect(result.current.isLoadingSession).toBe(false);
        });

        expect(result.current.filteredQuestions).toHaveLength(2);
        expect(result.current.filteredQuestions[0].id).toBe('q0');
        expect(leitnerSystem.getDueQuestions).not.toHaveBeenCalled();
    });

    it('ends session and calculates results correctly', async () => {
        const { result } = renderHook(() => useLeitnerSession({
            questions: mockQuestions,
            onSessionReset: mockOnSessionReset
        }));

        await waitFor(() => expect(result.current.isLoadingSession).toBe(false));

        const submissions = {
            q0: { isSubmitted: true, isCorrect: true },
            q1: { isSubmitted: true, isCorrect: false },
        };

        act(() => {
            result.current.endCurrentSession(submissions as unknown as Record<string, { isSubmitted: boolean; isCorrect: boolean }>);
        });

        expect(result.current.isSessionComplete).toBe(true);
        expect(result.current.savedSessionResults).toEqual(expect.objectContaining({
            correct: 1,
            total: 5
        }));
    });
});
