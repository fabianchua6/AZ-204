import { renderHook, act } from '@testing-library/react';
import { useQuizStateWithLeitner } from '../use-quiz-state-leitner';
import { getStoredSyncCode, sync } from '@/lib/sync-client';
import type { Question } from '@/types/quiz';

jest.mock('@/lib/leitner', () => ({
  leitnerSystem: {
    ensureInitialized: jest.fn(),
    processAnswer: jest.fn(),
    getQuestionProgress: jest.fn(),
    clearProgress: jest.fn(),
  },
}));

jest.mock('@/lib/sync-client', () => ({
  getStoredSyncCode: jest.fn(),
  sync: jest.fn(),
}));

jest.mock('../leitner/use-leitner-session', () => ({
  useLeitnerSession: jest.fn(),
}));

jest.mock('../leitner/use-leitner-progress', () => ({
  useLeitnerProgress: jest.fn(),
}));

jest.mock('../leitner/use-leitner-stats', () => ({
  useLeitnerStats: jest.fn(() => ({}) as unknown),
}));

import { useLeitnerSession } from '../leitner/use-leitner-session';
import { useLeitnerProgress } from '../leitner/use-leitner-progress';

describe('useQuizStateWithLeitner', () => {
  const mockEndCurrentSession = jest.fn();
  const mockResetProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useLeitnerSession as jest.Mock).mockReturnValue({
      filteredQuestions: [],
      sessionId: null,
      startNewSession: jest.fn(),
      endCurrentSession: mockEndCurrentSession,
      isSessionComplete: false,
      savedSessionResults: null,
      isLoadingSession: false,
    });

    (useLeitnerProgress as jest.Mock).mockReturnValue({
      resetProgress: mockResetProgress,
      submissionStates: { q1: { isSubmitted: true } },
      updateAnswers: jest.fn(),
      submitQuestion: jest.fn(),
      currentQuestionIndex: 0,
      answers: {},
      nextQuestion: jest.fn(),
      previousQuestion: jest.fn(),
      goToQuestion: jest.fn(),
      getSubmissionState: jest.fn(),
    });
  });

  it('uses smart sync merge on session end when sync code exists', () => {
    (getStoredSyncCode as jest.Mock).mockReturnValue('AZ-ABC123');
    (sync as jest.Mock).mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useQuizStateWithLeitner([] as Question[], null, jest.fn())
    );

    act(() => {
      result.current.actions.endCurrentSession();
    });

    expect(mockEndCurrentSession).toHaveBeenCalledWith({
      q1: { isSubmitted: true },
    });
    expect(sync).toHaveBeenCalledWith('AZ-ABC123');
  });
});
