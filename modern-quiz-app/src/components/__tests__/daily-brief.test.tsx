import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DailyBrief } from '../daily-brief';
import { leitnerSystem } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';

jest.mock('@/lib/leitner', () => ({
  leitnerSystem: {
    ensureInitialized: jest.fn().mockResolvedValue(undefined),
    getStats: jest.fn(),
  },
}));

jest.mock('@/lib/question-service', () => ({
  questionService: {
    filterQuestions: jest.fn(),
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

jest.mock('@/components/activity-heatmap', () => ({
  ActivityHeatmap: () => <div data-testid='activity-heatmap'>heatmap</div>,
}));

describe('DailyBrief', () => {
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
      answerIndexes: [0],
      topic: 'T1',
      hasCode: false,
      answer: 'B',
    },
  ];

  const filteredQuestions = [mockQuestions[0]];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'scrollTo', {
      value: jest.fn(),
      writable: true,
    });
    (questionService.filterQuestions as jest.Mock).mockReturnValue(
      filteredQuestions
    );
    (leitnerSystem.getStats as jest.Mock).mockReturnValue({
      totalQuestions: 1,
      questionsStarted: 1,
      boxDistribution: { 1: 1, 2: 0, 3: 0 },
      dueToday: 1,
      accuracyRate: 1,
      streakDays: 3,
    });
    (loadFromLocalStorage as jest.Mock).mockReturnValue('');
  });

  it('does not show if already shown today', async () => {
    (loadFromLocalStorage as jest.Mock).mockReturnValue('2026-02-19');

    const { container } = render(<DailyBrief questions={mockQuestions} />);

    await waitFor(() => {
      expect(leitnerSystem.ensureInitialized).not.toHaveBeenCalled();
    });

    expect(container.innerHTML).toBe('');
  });

  it('loads stats from filtered questions and opens brief', async () => {
    render(<DailyBrief questions={mockQuestions} />);

    await waitFor(() => {
      expect(questionService.filterQuestions).toHaveBeenCalledWith(
        mockQuestions
      );
      expect(leitnerSystem.getStats).toHaveBeenCalledWith(filteredQuestions);
    });

    expect(screen.getByText("Here's your study brief")).toBeTruthy();
    expect(screen.getByText('Due Today')).toBeTruthy();
    expect(screen.getByText('Started')).toBeTruthy();
    expect(screen.getByTestId('activity-heatmap')).toBeTruthy();
    const scrollContainer = screen.getByTestId('daily-brief-scroll-container');
    expect(scrollContainer.className).toContain('show-scrollbar');
    expect(scrollContainer.className).toContain('[touch-action:pan-y]');
  });

  it('persists daily-brief-last-shown when dismissed from drag handle', async () => {
    render(<DailyBrief questions={mockQuestions} />);

    const closeButton = await screen.findByRole('button', {
      name: 'Close daily brief',
    });

    fireEvent.click(closeButton);

    expect(saveToLocalStorage).toHaveBeenCalledWith(
      'daily-brief-last-shown',
      '2026-02-19'
    );
  });

  it('supports swipe-down dismissal from pull handle', async () => {
    render(<DailyBrief questions={mockQuestions} />);

    const closeButton = await screen.findByRole('button', {
      name: 'Close daily brief',
    });

    fireEvent.touchStart(closeButton, {
      touches: [{ clientY: 10 }],
    });
    fireEvent.touchEnd(closeButton, {
      changedTouches: [{ clientY: 80 }],
    });

    expect(saveToLocalStorage).toHaveBeenCalledWith(
      'daily-brief-last-shown',
      '2026-02-19'
    );
  });
});
