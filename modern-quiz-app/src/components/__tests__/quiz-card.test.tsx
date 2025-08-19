import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizCard } from '../quiz-card';
import { Question } from '@/types/quiz';

const mockQuestion: Question = {
  id: 'test-1',
  question: 'What is Azure App Service?',
  options: [
    'A cloud-based platform',
    'A database service',
    'A storage solution',
    'A networking tool',
  ],
  answerIndexes: [0],
  answer: 'Azure App Service is a cloud-based platform.',
  hasCode: false,
  topic: 'App Service',
};

const mockStats = {
  totalQuestions: 10,
  answeredQuestions: 5,
  correctAnswers: 3,
  incorrectAnswers: 2,
  accuracy: 0.6,
};

const defaultProps = {
  question: mockQuestion,
  selectedAnswers: [],
  showAnswer: false,
  onAnswerSelect: jest.fn(),
  onShowAnswer: jest.fn(),
  onNext: jest.fn(),
  onPrevious: jest.fn(),
  canGoNext: true,
  canGoPrevious: true,
  topics: ['App Service', 'Functions', 'Storage'],
  selectedTopic: 'App Service',
  onTopicChange: jest.fn(),
  stats: mockStats,
};

describe('QuizCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders question correctly', () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByText('What is Azure App Service?')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<QuizCard {...defaultProps} />);
    mockQuestion.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('shows topic badge', () => {
    render(<QuizCard {...defaultProps} />);
    const topicBadges = screen.getAllByText('App Service');
    expect(topicBadges.length).toBeGreaterThan(0);
  });

  it('calls onAnswerSelect when option is selected', () => {
    const onAnswerSelect = jest.fn();
    render(<QuizCard {...defaultProps} onAnswerSelect={onAnswerSelect} />);

    const firstOption = screen.getByText('A cloud-based platform');
    firstOption.click();

    expect(onAnswerSelect).toHaveBeenCalledWith('test-1', [0]);
  });

  it('shows answer when showAnswer is true', () => {
    render(<QuizCard {...defaultProps} showAnswer={true} />);
    expect(
      screen.getByText(/azure app service is a cloud-based platform/i)
    ).toBeInTheDocument();
  });

  it('handles multiple selection questions', () => {
    const multiSelectQuestion = {
      ...mockQuestion,
      answerIndexes: [0, 1],
    };

    render(<QuizCard {...defaultProps} question={multiSelectQuestion} />);
    expect(screen.getByText(/Multiple Choice Question/i)).toBeInTheDocument();
    expect(screen.getByText(/Select all correct answers/i)).toBeInTheDocument();
  });
});
