import { fireEvent, render, screen } from '@testing-library/react';
import { SessionResults } from '../session-results';

jest.mock('@/components/quiz/quiz-controls', () => ({
  QuizControls: () => <div data-testid='quiz-controls'>controls</div>,
}));

jest.mock('@/components/leitner/leitner-box-bar', () => ({
  LeitnerBoxBar: ({
    totalQuestions,
  }: {
    boxDistribution: Record<number, number>;
    totalQuestions: number;
  }) => <div data-testid='leitner-box-bar'>total:{totalQuestions}</div>,
}));

describe('SessionResults', () => {
  const baseProps = {
    sessionResults: {
      correct: 7,
      incorrect: 3,
      total: 10,
    },
    stats: {
      totalQuestions: 20,
      answeredQuestions: 10,
      correctAnswers: 7,
      incorrectAnswers: 3,
      accuracy: 70,
      leitner: {
        totalQuestions: 20,
        questionsStarted: 10,
        boxDistribution: { 1: 5, 2: 8, 3: 7 },
        dueToday: 4,
        accuracyRate: 0.7,
        streakDays: 3,
      },
    },
    onStartNewSession: jest.fn(),
    topics: ['Storage'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders session metrics and shared controls', () => {
    render(<SessionResults {...baseProps} />);

    expect(screen.getByText('Session Complete!')).toBeTruthy();
    expect(screen.getByText('Total Attempts')).toBeTruthy();
    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.getByText('Wrong')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByTestId('quiz-controls')).toBeTruthy();
    expect(screen.getByTestId('leitner-box-bar')).toBeTruthy();
  });

  it('shows continue CTA when dueToday is greater than zero', () => {
    render(<SessionResults {...baseProps} />);

    expect(screen.getByText('Continue Learning (4 left)')).toBeTruthy();
  });

  it('shows start-new CTA when dueToday is zero and invokes handler', () => {
    render(
      <SessionResults
        {...baseProps}
        stats={{
          ...baseProps.stats,
          leitner: {
            ...baseProps.stats.leitner,
            dueToday: 0,
          },
        }}
      />
    );

    const button = screen.getByText('Start New Session');
    fireEvent.click(button);

    expect(baseProps.onStartNewSession).toHaveBeenCalledTimes(1);
  });
});
