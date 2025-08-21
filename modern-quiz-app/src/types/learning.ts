export interface LearningRecord {
  questionId: string;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastAnswered: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-1 scale
  nextReviewDate: Date;
  streak: number; // consecutive correct answers
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questionsAnswered: number;
  correctAnswers: number;
  topics: string[];
  averageTimePerQuestion: number;
}

export interface LearningMetrics {
  totalQuestions: number;
  masteredQuestions: number; // streak >= 3 and confidence >= 0.8
  strugglingQuestions: number; // accuracy < 50%
  reviewDueQuestions: number;
  averageConfidence: number;
  strongTopics: string[];
  weakTopics: string[];
}

export type LearningStrategy =
  | 'spaced_repetition' // Focus on due reviews
  | 'active_recall' // Mix of new + review
  | 'weak_areas' // Focus on struggling topics
  | 'comprehensive' // Balanced approach
  | 'quick_review'; // Short session, high-confidence questions

export interface SmartQuizSettings {
  strategy: LearningStrategy;
  sessionLength: number; // minutes
  newQuestionRatio: number; // 0-1, how many new vs review questions
  difficultyPreference: 'adaptive' | 'challenging' | 'confidence_building';
  topicFocus?: string[]; // specific topics to focus on
}
