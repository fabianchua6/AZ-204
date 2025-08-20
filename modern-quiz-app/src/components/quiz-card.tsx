'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizNavigation } from '@/components/quiz/quiz-navigation';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { QuizBadges } from '@/components/quiz/quiz-badges';
import { QuizQuestionContent } from '@/components/quiz/quiz-question-content';
import { MultipleChoiceWarning } from '@/components/quiz/multiple-choice-warning';
import { useAnswerSelection } from '@/hooks/use-answer-selection';
import {
  createNavigationHandler,
  type QuizNavigationState,
  type QuizNavigationActions,
} from '@/lib/quiz-navigation';
import type { Question } from '@/types/quiz';
import type { QuizStats as QuizStatsType } from '@/types/quiz';

interface QuizCardProps {
  question: Question;
  selectedAnswers: number[];
  showAnswer: boolean;
  onAnswerSelect: (questionId: string, answerIndexes: number[]) => void;
  onShowAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  // Contextual controls
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  stats: QuizStatsType;
}

export function QuizCard({
  question,
  selectedAnswers: externalSelectedAnswers,
  showAnswer: externalShowAnswer,
  onAnswerSelect,
  onShowAnswer,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  topics,
  selectedTopic,
  onTopicChange,
  stats,
}: QuizCardProps) {
  const isMultipleChoice = question.answerIndexes.length > 1;

  // Use our modular hooks - but keep external control for practice mode
  const answerSelection = useAnswerSelection({
    questionId: question.id,
    isMultipleChoice,
    initialAnswers: externalSelectedAnswers,
    onAnswerChange: onAnswerSelect,
    disabled: externalShowAnswer,
  });

  // Create navigation state and actions for practice mode
  const navigationState: QuizNavigationState = {
    showAnswer: externalShowAnswer,
    hasAnswers: answerSelection.hasAnswers,
    canGoNext,
    canGoPrevious,
    answerSubmitted: false, // Practice mode doesn't submit
    isSubmitting: false,
  };

  const navigationActions: QuizNavigationActions = {
    onShowAnswer,
    onNext,
    onPrevious,
  };

  const navigationHandler = createNavigationHandler(
    navigationState,
    navigationActions
  );

  return (
    <div className='space-y-4'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={stats.totalQuestions}
        stats={stats}
      />

      {/* Main Quiz Card */}
      <Card className='dark:border-border-light relative border border-border bg-card shadow-sm dark:shadow-sm'>
        {/* Header with Topic Badge and Navigation */}
        <CardHeader className='sticky top-0 z-10 rounded-t-lg bg-card/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:pt-6'>
          <div className='flex flex-row items-center justify-between gap-3'>
            <QuizBadges question={question} />

            {/* Navigation in Header */}
            <div className='flex-shrink-0'>
              <QuizNavigation
                showAnswer={externalShowAnswer}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                selectedAnswers={answerSelection.selectedAnswers}
                onPrevious={onPrevious}
                onNext={navigationHandler.handleNext}
                onShowAnswer={navigationHandler.handleShowAnswer}
                compact={true}
              />
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
          <QuizQuestionContent question={question} />

          {/* Options */}
          {question.options.length > 0 && (
            <div className='mb-4 space-y-2 sm:mb-6 sm:space-y-3'>
              <MultipleChoiceWarning show={isMultipleChoice} />

              {question.options.map((option, index) => (
                <QuizOption
                  key={index}
                  option={option}
                  index={index}
                  isSelected={answerSelection.isAnswerSelected(index)}
                  isCorrect={question.answerIndexes.includes(index)}
                  showAnswer={externalShowAnswer}
                  isMultipleChoice={isMultipleChoice}
                  onSelect={answerSelection.toggleAnswer}
                  disabled={externalShowAnswer}
                />
              ))}
            </div>
          )}

          {/* Answer Section */}
          <QuizAnswer
            answer={question.answer}
            showAnswer={externalShowAnswer}
          />
        </CardContent>
      </Card>
    </div>
  );
}
