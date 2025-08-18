import { render, screen } from '@testing-library/react';
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

const defaultProps = {
  question: mockQuestion,
  onAnswer: jest.fn(),
  selectedAnswers: [],
  showAnswer: false,
  currentIndex: 0,
  totalQuestions: 10,
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

  it('shows progress indicator', () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
  });

  it('calls onAnswer when option is selected', () => {
    const onAnswer = jest.fn();
    render(<QuizCard {...defaultProps} onAnswer={onAnswer} />);
    
    const firstOption = screen.getByText('A cloud-based platform');
    firstOption.click();
    
    expect(onAnswer).toHaveBeenCalledWith([0]);
  });

  it('shows answer when showAnswer is true', () => {
    render(<QuizCard {...defaultProps} showAnswer={true} />);
    expect(screen.getByText(/azure app service is a cloud-based platform/i)).toBeInTheDocument();
  });

  it('handles multiple selection questions', () => {
    const multiSelectQuestion = {
      ...mockQuestion,
      answerIndexes: [0, 1],
    };
    
    render(<QuizCard {...defaultProps} question={multiSelectQuestion} />);
    expect(screen.getByText(/select all that apply/i)).toBeInTheDocument();
  });
});
