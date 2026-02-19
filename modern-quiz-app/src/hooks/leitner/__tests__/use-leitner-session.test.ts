import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeitnerSession } from '../use-leitner-session';
import { leitnerSystem } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
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
  shuffleArray: jest.fn(<T>(arr: T[]) => [...arr]),
}));

describe('useLeitnerSession', () => {
  const mockQuestions: Question[] = Array.from({ length: 5 }, (_, i) => ({
    id: `q${i}`,
    question: `Q${i}`,
    options: ['A'],
    answerIndexes: [0],
    topic: 'T1',
    hasCode: false,
    answer: 'A',
  }));

  const mockOnSessionReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (questionService.filterQuestions as jest.Mock).mockReturnValue(
      mockQuestions
    );
    (leitnerSystem.getDueQuestions as jest.Mock).mockResolvedValue(
      mockQuestions
    );
    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => defaultValue
    );
  });

  it('generates a new session on mount if no saved session', async () => {
    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

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
      totalQuestions: 5,
    };
    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => {
        if (key === 'leitner-current-session') return savedSession;
        return defaultValue;
      }
    );

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(result.current.filteredQuestions).toHaveLength(2);
    expect(result.current.filteredQuestions[0].id).toBe('q0');
    expect(leitnerSystem.getDueQuestions).not.toHaveBeenCalled();
  });

  it('generates a new session when saved session is expired', async () => {
    const savedSession = {
      questionIds: ['q0', 'q1'],
      createdAt: Date.now() - 5 * 60 * 60 * 1000,
      totalQuestions: 5,
    };

    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => {
        if (key === 'leitner-current-session') return savedSession;
        return defaultValue;
      }
    );

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);
    expect(result.current.filteredQuestions).toHaveLength(mockQuestions.length);
  });

  it('generates a new session when saved session total questions drift by more than 10%', async () => {
    const savedSession = {
      questionIds: ['q0', 'q1'],
      createdAt: Date.now(),
      totalQuestions: 3,
    };

    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => {
        if (key === 'leitner-current-session') return savedSession;
        return defaultValue;
      }
    );

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);
    expect(result.current.filteredQuestions).toHaveLength(mockQuestions.length);
  });

  it('generates a fresh session when restored questions are already all answered', async () => {
    const savedSession = {
      questionIds: ['q0', 'q1'],
      createdAt: Date.now(),
      totalQuestions: 5,
    };

    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => {
        if (key === 'leitner-current-session') return savedSession;
        if (key === 'leitner-submission-states') {
          return {
            q0: { isSubmitted: true },
            q1: { isSubmitted: true },
          };
        }
        return defaultValue;
      }
    );

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(saveToLocalStorage).toHaveBeenCalledWith(
      'leitner-current-session',
      null
    );
    expect(saveToLocalStorage).toHaveBeenCalledWith(
      'leitner-submission-states',
      {}
    );
    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);
  });

  it('generates a new session when restore recovers less than 50% of saved question ids', async () => {
    const savedSession = {
      questionIds: ['missing-1', 'missing-2', 'q0', 'missing-3'],
      createdAt: Date.now(),
      totalQuestions: 5,
    };

    (loadFromLocalStorage as jest.Mock).mockImplementation(
      (key, defaultValue) => {
        if (key === 'leitner-current-session') return savedSession;
        return defaultValue;
      }
    );

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);
    expect(result.current.filteredQuestions).toHaveLength(mockQuestions.length);
  });

  it('ends session and calculates results correctly', async () => {
    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => expect(result.current.isLoadingSession).toBe(false));

    const submissions = {
      q0: { isSubmitted: true, isCorrect: true },
      q1: { isSubmitted: true, isCorrect: false },
    };

    act(() => {
      result.current.endCurrentSession(
        submissions as unknown as Record<
          string,
          { isSubmitted: boolean; isCorrect: boolean }
        >
      );
    });

    expect(result.current.isSessionComplete).toBe(true);
    expect(result.current.savedSessionResults).toEqual(
      expect.objectContaining({
        correct: 1,
        total: 5,
      })
    );
  });

  it('keeps generation blocked during end-session timeout window', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useLeitnerSession({
        questions: mockQuestions,
        onSessionReset: mockOnSessionReset,
      })
    );

    await waitFor(() => expect(result.current.isLoadingSession).toBe(false));
    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.endCurrentSession({
        q0: { isSubmitted: true, isCorrect: true },
      });
    });

    expect(saveToLocalStorage).toHaveBeenCalledWith(
      'leitner-current-session',
      null
    );
    expect(result.current.isSessionComplete).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(leitnerSystem.getDueQuestions).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
