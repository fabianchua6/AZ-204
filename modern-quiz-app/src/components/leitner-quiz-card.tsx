'use client';

// React imports
import { useCallback } from 'react';

// Third-party imports
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

// UI component imports
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Quiz component imports
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { QuizBadges } from '@/components/quiz/quiz-badges';
import { QuizQuestionContent } from '@/components/quiz/quiz-question-content';
import { MultipleChoiceWarning } from '@/components/quiz/multiple-choice-warning';

// Hook imports
import { useQuizCardState } from '@/hooks/use-quiz-card-state';

// Type imports
import type { Question } from '@/types/quiz';

interface EnhancedQuizStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  leitner: {
    totalQuestions: number;
    boxDistribution: Record<number, number>;
    dueToday: number;
    accuracyRate: number;
    streakDays: number;
  };
}

interface LeitnerQuizCardProps {
  question: Question;
  selectedAnswers: number[];
  onAnswerSelect: (questionId: string, answerIndexes: number[]) => void;
  onAnswerSubmit: (
    questionId: string,
    answerIndexes: number[]
  ) => Promise<
    | {
        correct: boolean;
        movedFromBox: number;
        movedToBox: number;
        nextReview: string;
      }
    | undefined
  >;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  stats: EnhancedQuizStats;
  questionProgress?: {
    questionId: string;
    currentBox: number;
    nextReviewDate: string;
    timesCorrect: number;
    timesIncorrect: number;
    lastReviewed: string;
    lastAnswerCorrect: boolean;
  } | null;
  // Add function to get submission state
  getSubmissionState?: (questionId: string) => {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
    submittedAt: number;
    submittedAnswers: number[]; // Add submitted answers to the type
  } | null;
}

export function LeitnerQuizCard({
  question,
  selectedAnswers: externalSelectedAnswers,
  onAnswerSelect,
  onAnswerSubmit,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  topics,
  selectedTopic,
  onTopicChange,
  stats,
  questionProgress,
  getSubmissionState,
}: LeitnerQuizCardProps) {
  const isMultipleChoice = question.answerIndexes.length > 1;

  // Use our modular hooks
  const cardState = useQuizCardState({
    questionId: question.id,
    autoAdvanceOnCorrect: false,
    autoAdvanceDelay: 0,
    initialSubmissionState: (() => {
      const submissionState = getSubmissionState?.(question.id);
      return submissionState
        ? {
            isSubmitted: submissionState.isSubmitted,
            isCorrect: submissionState.isCorrect,
            showAnswer: submissionState.showAnswer,
          }
        : undefined;
    })(),
  });

  // Handle answer selection with proper multi-select support
  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (cardState.answerSubmitted) {
        return;
      }

      let newAnswers: number[];
      
      if (isMultipleChoice) {
        // Multi-select: toggle the option
        if (externalSelectedAnswers.includes(optionIndex)) {
          newAnswers = externalSelectedAnswers.filter(i => i !== optionIndex);
        } else {
          newAnswers = [...externalSelectedAnswers, optionIndex];
        }
      } else {
        // Single select: replace existing selection
        newAnswers = [optionIndex];
      }

      onAnswerSelect(question.id, newAnswers);
    },
    [cardState.answerSubmitted, onAnswerSelect, question.id, isMultipleChoice, externalSelectedAnswers]
  );

  const handleSubmit = useCallback(async () => {
    if (
      !question.id ||
      !Array.isArray(externalSelectedAnswers) ||
      externalSelectedAnswers.length === 0 ||
      cardState.answerSubmitted
    ) {
      return;
    }

    cardState.startSubmitting();

    try {
      const result = await onAnswerSubmit(question.id, externalSelectedAnswers);
      if (result) {
        // Update stats from result
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      cardState.finishSubmitting();
    }
  }, [question.id, externalSelectedAnswers, cardState, onAnswerSubmit]);

  // Simplified navigation handlers - direct calls
  const handleNext = useCallback(() => {
    cardState.cancelAutoAdvance();
    if (onNext) {
      onNext();
    }
  }, [cardState, onNext]);

  const handlePrevious = useCallback(() => {
    cardState.cancelAutoAdvance();
    if (onPrevious) {
      onPrevious();
    }
  }, [cardState, onPrevious]);

  // Custom button states for Leitner mode - don't disable navigation during submission
  const buttonStates = {
    showAnswerDisabled: false,
    nextDisabled: !canGoNext, // Remove isSubmitting check for navigation
    previousDisabled: !canGoPrevious, // Remove isSubmitting check for navigation
    submitDisabled:
      externalSelectedAnswers.length === 0 ||
      cardState.isSubmitting ||
      cardState.answerSubmitted,
    showSubmitButton:
      !cardState.answerSubmitted && externalSelectedAnswers.length > 0,
  };

  // Get box styling using CSS classes
  const currentBox = questionProgress?.currentBox || 1;
  const boxBgClass = `leitner-box-bg-${currentBox}`;
  const boxTextClass = `leitner-box-text-${currentBox}`;

  return (
    <div className='space-y-4'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={stats.totalQuestions}
        stats={{
          totalQuestions: stats.totalQuestions,
          answeredQuestions: stats.answeredQuestions,
          correctAnswers: stats.correctAnswers,
          incorrectAnswers: stats.incorrectAnswers,
          accuracy: stats.accuracy,
        }}
      />

      {/* Main Quiz Card */}
      <Card className='relative border border-border bg-card shadow-sm dark:shadow-sm'>
        {/* Header with Box Info, Topic Badge and Navigation */}
        <CardHeader className='sticky top-0 z-10 rounded-t-lg bg-card/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:pt-6'>
          <div className='flex flex-row items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Box Indicator with Icon - First */}
              <div
                className={`flex h-8 items-center justify-center gap-1 rounded-md border-2 border-border px-2 text-[11px] font-bold shadow-sm ${boxBgClass} ${boxTextClass}`}
              >
                <Package className='h-3 w-3' />
                <span className='leading-none'>{currentBox}</span>
              </div>

              {/* Topic and Code Badges */}
              <QuizBadges question={question} />
            </div>

            {/* Navigation */}
            <div className='flex-shrink-0'>
              <div className='flex items-center gap-2'>
                {canGoPrevious && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handlePrevious}
                    className='h-8 w-8 p-0'
                    disabled={buttonStates.previousDisabled}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                )}
                {canGoNext && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleNext}
                    className='h-8 w-8 p-0'
                    disabled={buttonStates.nextDisabled}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
          <QuizQuestionContent question={question} />

          {/* Options */}
          {question.options.length > 0 && (
            <div className='mb-4 space-y-2 sm:mb-6 sm:space-y-3'>
              <MultipleChoiceWarning
                show={isMultipleChoice && !cardState.answerSubmitted}
              />

              {question.options.map((option, index) => {
                // Get the submission state to access submitted answers
                const submissionState = getSubmissionState?.(question.id);

                // Use submitted answers when showing answer, otherwise use current selection
                const isSelected =
                  cardState.showAnswer && submissionState?.submittedAnswers
                    ? submissionState.submittedAnswers.includes(index)
                    : externalSelectedAnswers.includes(index);

                const isCorrect = question.answerIndexes.includes(index);

                return (
                  <QuizOption
                    key={index}
                    option={option}
                    index={index}
                    isSelected={isSelected}
                    isCorrect={isCorrect}
                    showAnswer={cardState.showAnswer}
                    isMultipleChoice={isMultipleChoice}
                    onSelect={handleOptionSelect}
                    disabled={cardState.answerSubmitted}
                  />
                );
              })}

              {/* Submit Answer Button */}
              {buttonStates.showSubmitButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='pt-2'
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={buttonStates.submitDisabled}
                    className='w-full sm:w-auto'
                    size='lg'
                  >
                    {cardState.isSubmitting ? 'Processing...' : 'Submit Answer'}
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {/* Answer Section */}
          <QuizAnswer
            answer={question.answer}
            showAnswer={cardState.showAnswer}
            isCorrect={cardState.lastSubmissionResult ?? true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
