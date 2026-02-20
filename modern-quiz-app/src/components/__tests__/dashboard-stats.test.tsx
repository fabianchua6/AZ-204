import { render, screen, waitFor } from '@testing-library/react';
import { DashboardStats } from '../dashboard-stats';
import { questionService } from '@/lib/question-service';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';

jest.mock('@/lib/question-service', () => ({
  questionService: {
    getAppStatistics: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  loadFromLocalStorage: jest.fn(),
  saveToLocalStorage: jest.fn(),
}));

jest.mock('@/lib/leitner/utils', () => ({
  DateUtils: {
    getLocalDateString: jest.fn(() => '2026-02-19'),
  },
}));

jest.mock('@/components/leitner/leitner-box-bar', () => ({
  LeitnerBoxBar: ({
    boxDistribution,
    totalQuestions,
  }: {
    boxDistribution: Record<number, number>;
    totalQuestions: number;
  }) => (
    <div data-testid='leitner-box-bar'>
      box:{boxDistribution[1] || 0}-{boxDistribution[2] || 0}-
      {boxDistribution[3] || 0}|total:{totalQuestions}
    </div>
  ),
}));

describe('DashboardStats', () => {
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
  ];

  const mockAppStats = {
    totalQuestions: 10,
    questionsStarted: 7,
    boxDistribution: { 1: 2, 2: 3, 3: 5 },
    dueToday: 4,
    accuracyRate: 0.75,
    streakDays: 4,
    answeredQuestions: 7,
    correctAnswers: 5,
    incorrectAnswers: 2,
    completionAccuracy: 71,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (questionService.getAppStatistics as jest.Mock).mockResolvedValue(
      mockAppStats
    );
    (loadFromLocalStorage as jest.Mock).mockReturnValue({
      currentStreak: 2,
      lastStudyDate: '2026-02-18',
      bestStreak: 10,
    });
  });

  it('renders compact mode from precomputed stats without async fetch', () => {
    render(
      <DashboardStats
        section='compact'
        stats={{
          leitner: {
            totalQuestions: 10,
            questionsStarted: 7,
            boxDistribution: { 1: 2, 2: 3, 3: 5 },
            dueToday: 4,
            accuracyRate: 75,
            streakDays: 8,
          },
        }}
      />
    );

    expect(screen.getByText('Questions Started')).toBeTruthy();
    expect(screen.getByText('Accuracy Rate')).toBeTruthy();
    expect(screen.getByText('Day Streak')).toBeTruthy();
    expect(screen.getByText('Progress by Box')).toBeTruthy();
    expect(questionService.getAppStatistics).not.toHaveBeenCalled();
  });

  it('renders stats section and persists high-water best streak', async () => {
    render(<DashboardStats questions={mockQuestions} section='stats' />);

    await waitFor(() => {
      expect(questionService.getAppStatistics).toHaveBeenCalledWith(
        mockQuestions
      );
    });

    expect(screen.getByText('Due Today')).toBeTruthy();
    expect(screen.getByText('Current Streak')).toBeTruthy();
    expect(screen.getByText('Best Streak')).toBeTruthy();

    await waitFor(() => {
      expect(saveToLocalStorage).toHaveBeenCalledWith('study-streak', {
        currentStreak: 4,
        lastStudyDate: '2026-02-19',
        bestStreak: 10,
      });
    });
  });

  it('renders leitner-only section with shared box bar', async () => {
    render(<DashboardStats questions={mockQuestions} section='leitner' />);

    await waitFor(() => {
      expect(screen.getByText('Leitner Box Distribution')).toBeTruthy();
      expect(screen.getByTestId('leitner-box-bar')).toBeTruthy();
    });
  });

  it('renders both stats and leitner sections by default', async () => {
    render(<DashboardStats questions={mockQuestions} />);

    await waitFor(() => {
      expect(screen.getByText('Due Today')).toBeTruthy();
      expect(screen.getByText('Leitner Box Distribution')).toBeTruthy();
    });
  });
});
