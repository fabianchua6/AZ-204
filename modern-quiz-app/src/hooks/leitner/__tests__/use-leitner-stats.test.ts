import { act, renderHook, waitFor } from '@testing-library/react';
import { useLeitnerStats } from '../use-leitner-stats';
import { questionService } from '@/lib/question-service';
import type { Question } from '@/types/quiz';

// Mock dependencies
jest.mock('@/lib/question-service', () => ({
  questionService: {
    getAppStatistics: jest.fn(),
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
      answer: 'A',
    },
    {
      id: 'q2',
      question: 'Q2',
      options: ['B'],
      answerIndexes: [1],
      topic: 'T1',
      hasCode: false,
      answer: 'B',
    },
  ];

  const mockSubmissionStates = {
    q1: {
      isSubmitted: true,
      isCorrect: true,
      showAnswer: true,
      submittedAt: 0,
      submittedAnswers: [0],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (questionService.getAppStatistics as jest.Mock).mockResolvedValue({
      totalQuestions: 2,
      answeredQuestions: 1,
      correctAnswers: 1,
      incorrectAnswers: 0,
      completionAccuracy: 100,
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

    expect(questionService.getAppStatistics).toHaveBeenCalledWith(
      mockQuestions
    );
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
      expect(questionService.getAppStatistics).toHaveBeenCalled();
    });
  });

  it('debounces stats calculation by 100ms', async () => {
    jest.useFakeTimers();

    renderHook(() => useLeitnerStats(mockQuestions, {}));

    expect(questionService.getAppStatistics).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(99);
    });
    expect(questionService.getAppStatistics).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(questionService.getAppStatistics).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('cancels stale timer when dependencies change before 100ms', async () => {
    jest.useFakeTimers();

    const { rerender } = renderHook(
      ({ subs }) => useLeitnerStats(mockQuestions, subs),
      { initialProps: { subs: {} } }
    );

    await act(async () => {
      jest.advanceTimersByTime(50);
      rerender({ subs: mockSubmissionStates });
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(99);
      await Promise.resolve();
    });

    expect(questionService.getAppStatistics).toHaveBeenCalledTimes(0);

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(questionService.getAppStatistics).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('keeps default stats when stats calculation fails', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    (questionService.getAppStatistics as jest.Mock).mockRejectedValueOnce(
      new Error('boom')
    );

    const { result } = renderHook(() => useLeitnerStats(mockQuestions, {}));

    await waitFor(() => {
      expect(questionService.getAppStatistics).toHaveBeenCalledWith(
        mockQuestions
      );
    });

    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.leitner.totalQuestions).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update stats:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
