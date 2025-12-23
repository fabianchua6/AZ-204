import { renderHook, act } from '@testing-library/react';
import { useLeitnerProgress } from '../use-leitner-progress';
import { loadFromLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';

// Mock utils
jest.mock('@/lib/utils', () => ({
    loadFromLocalStorage: jest.fn(),
    saveToLocalStorage: jest.fn(),
}));

describe('useLeitnerProgress', () => {
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
            answerIndexes: [0],
            topic: 'T1',
            hasCode: false,
            answer: 'B'
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (loadFromLocalStorage as jest.Mock).mockImplementation((key, defaultValue) => defaultValue);
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useLeitnerProgress(mockQuestions));

        expect(result.current.currentQuestionIndex).toBe(0);
        expect(result.current.answers).toEqual({});
        expect(result.current.submissionStates).toEqual({});
    });

    it('navigates questions correctly', () => {
        const { result } = renderHook(() => useLeitnerProgress(mockQuestions));

        act(() => {
            result.current.nextQuestion();
        });
        expect(result.current.currentQuestionIndex).toBe(1);

        act(() => {
            result.current.previousQuestion();
        });
        expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('updates answers and submission state', () => {
        const { result } = renderHook(() => useLeitnerProgress(mockQuestions));

        act(() => {
            result.current.updateAnswers('q1', [0]);
        });
        expect(result.current.answers['q1']).toEqual([0]);

        act(() => {
            result.current.submitQuestion('q1', [0], true);
        });
        expect(result.current.submissionStates['q1']).toEqual(expect.objectContaining({
            isSubmitted: true,
            isCorrect: true,
            submittedAnswers: [0]
        }));
    });
});
