export interface Question {
  id: string;
  question: string;
  hasCode: boolean;
  options: string[];
  answerIndexes: number[];
  answer: string;
  topic: string;
  isPdf?: boolean; // Flag to indicate if this is a PDF question
}

// Utility function to safely check if a question is from PDF
export function isPdfQuestion(question: Question): boolean {
  return question.isPdf === true;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, number[]>;
  showAnswer: boolean;
  selectedTopic: string | null;
  filteredQuestions: Question[];
}

export interface QuizStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
}
