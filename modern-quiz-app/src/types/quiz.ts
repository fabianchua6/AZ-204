export interface Question {
  id: string;
  question: string;
  hasCode: boolean;
  options: string[];
  answerIndexes: number[];
  answer: string;
  topic: string;
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
