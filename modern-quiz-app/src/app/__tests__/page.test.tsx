import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizStateWithLeitner } from '@/hooks/use-quiz-state-leitner';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useSync } from '@/hooks/use-sync';

jest.mock('@/hooks/use-quiz-data', () => ({
  useQuizData: jest.fn(),
}));

jest.mock('@/hooks/use-quiz-state-leitner', () => ({
  useQuizStateWithLeitner: jest.fn(),
}));

jest.mock('@/hooks/use-scroll-direction', () => ({
  useScrollDirection: jest.fn(),
}));

jest.mock('@/hooks/use-sync', () => ({
  useSync: jest.fn(),
}));

jest.mock('@/components/header', () => ({
  Header: () => <div data-testid='header'>header</div>,
}));

jest.mock('@/components/daily-brief', () => ({
  DailyBrief: () => <div data-testid='daily-brief'>daily</div>,
}));

jest.mock('@/components/leitner-quiz-card', () => ({
  LeitnerQuizCard: ({ question }: { question: { id: string } }) => (
    <div data-testid='leitner-quiz-card'>quiz:{question.id}</div>
  ),
}));

jest.mock('@/components/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid='loading-spinner'>loading</div>,
}));

jest.mock('@/components/leitner/session-results', () => ({
  SessionResults: () => <div data-testid='session-results'>results</div>,
}));

jest.mock('@/components/dashboard-stats', () => ({
  DashboardStats: () => <div data-testid='dashboard-stats'>stats</div>,
}));

describe('Home page orchestration', () => {
  const syncNow = jest.fn();

  const baseLeitnerState = {
    currentQuestionIndex: 0,
    filteredQuestions: [
      {
        id: 'q1',
        question: 'Q1',
      },
    ],
    answers: {},
    isSessionComplete: false,
    sessionResults: null,
    stats: {
      totalQuestions: 10,
      answeredQuestions: 1,
      correctAnswers: 1,
      incorrectAnswers: 0,
      accuracy: 100,
      leitner: {
        totalQuestions: 10,
        questionsStarted: 1,
        boxDistribution: { 1: 5, 2: 3, 3: 2 },
        dueToday: 2,
        accuracyRate: 1,
        streakDays: 1,
      },
    },
    isLoadingSession: false,
    sessionProgress: {
      current: 1,
      total: 1,
      percentage: 100,
    },
    getQuestionProgress: jest.fn().mockReturnValue({
      current: 1,
      total: 1,
      percentage: 100,
    }),
    actions: {
      updateAnswers: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      previousQuestion: jest.fn(),
      getSubmissionState: jest.fn(),
      endCurrentSession: jest.fn(),
      startNewSession: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useScrollDirection as jest.Mock).mockReturnValue({
      isHeaderVisible: true,
    });
    (useSync as jest.Mock).mockReturnValue({ syncNow });
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [],
      topics: [],
      loading: false,
      error: null,
    });
    (useQuizStateWithLeitner as jest.Mock).mockReturnValue(baseLeitnerState);
  });

  it('renders loading state', () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [],
      topics: [],
      loading: true,
      error: null,
    });

    render(<Home />);

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders error state', () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [],
      topics: [],
      loading: false,
      error: 'boom',
    });

    render(<Home />);

    expect(screen.getByText('Error Loading Quiz Data')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('renders session results and triggers sync on completion', async () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [{ id: 'q1' }],
      topics: ['Storage'],
      loading: false,
      error: null,
    });

    (useQuizStateWithLeitner as jest.Mock).mockReturnValue({
      ...baseLeitnerState,
      isSessionComplete: true,
      sessionResults: {
        correct: 1,
        incorrect: 0,
        total: 1,
      },
    });

    render(<Home />);

    expect(screen.getByTestId('session-results')).toBeTruthy();

    await waitFor(() => {
      expect(syncNow).toHaveBeenCalledTimes(1);
    });
  });

  it('renders session loading state while initializing', () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [{ id: 'q1' }],
      topics: [],
      loading: false,
      error: null,
    });

    (useQuizStateWithLeitner as jest.Mock).mockReturnValue({
      ...baseLeitnerState,
      isLoadingSession: true,
      filteredQuestions: [],
    });

    render(<Home />);

    expect(screen.getByText('Loading session...')).toBeTruthy();
  });

  it('renders question card when current question exists', () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [{ id: 'q1' }],
      topics: ['Storage'],
      loading: false,
      error: null,
    });

    render(<Home />);

    expect(screen.getByTestId('leitner-quiz-card')).toBeTruthy();
    expect(screen.getByText('quiz:q1')).toBeTruthy();
  });

  it('renders completion fallback when no due question is available', () => {
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [{ id: 'q1' }],
      topics: ['Storage'],
      loading: false,
      error: null,
    });

    (useQuizStateWithLeitner as jest.Mock).mockReturnValue({
      ...baseLeitnerState,
      filteredQuestions: [],
      currentQuestionIndex: 0,
    });

    render(<Home />);

    expect(screen.getByText('All Questions Complete!')).toBeTruthy();
    expect(screen.getByTestId('dashboard-stats')).toBeTruthy();
  });
});
